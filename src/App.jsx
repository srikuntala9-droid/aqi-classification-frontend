import { useState } from "react";

const CLASSIFICATION_API =
  "https://aqi-classification.onrender.com/predict";

const CLUSTERING_API =
  "https://aqi-clustering-api.onrender.com/cluster";

const DEMO_USER = {
  email: "admin@aqiplatform.com",
  password: "AQI@123",
  name: "AQI Admin",
};

const DEFAULT_VALUES = [
  50, 52, 55, 58, 60, 62,
  65, 68, 70, 72, 75, 78,
  80, 82, 85, 88, 90, 92,
  95, 98, 100, 102, 105, 108,
];

function getAQIStatus(value) {
  if (value <= 50) return "Good";
  if (value <= 100) return "Satisfactory";
  if (value <= 200) return "Moderate";
  if (value <= 300) return "Poor";
  if (value <= 400) return "Very Poor";
  return "Severe";
}

function getAQIClass(value) {
  return getAQIStatus(value).toLowerCase().replace(" ", "-");
}

function getResultText(result) {
  if (!result) return "Not Analysed";

  const value =
    result.prediction ??
    result.classification ??
    result.category ??
    result.cluster ??
    result.cluster_label ??
    result.label ??
    result.result;

  if (value !== undefined && value !== null) {
    return String(value);
  }

  return JSON.stringify(result);
}

function getPageTitle(page) {
  const titles = {
    home: "Dashboard",
    applications: "Applications",
    analysis: "AQI Analysis",
    history: "Analysis History",
    help: "Help & Support",
    settings: "Settings",
  };

  return titles[page] || "Dashboard";
}

function App() {
  const [page, setPage] = useState("home");
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("aqi_logged_in") === "true"
  );
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [hourlyValues, setHourlyValues] = useState(DEFAULT_VALUES);
  const [classificationResult, setClassificationResult] = useState(null);
  const [clusteringResult, setClusteringResult] = useState(null);
  const [classificationLoading, setClassificationLoading] = useState(false);
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("aqi_history") || "[]");
    } catch {
      return [];
    }
  });

  const values = hourlyValues.map((value) =>
    value === "" ? 0 : Number(value)
  );

  const averageAQI =
    values.reduce((sum, value) => sum + value, 0) / 24;

  const status = getAQIStatus(averageAQI);

  function updateHourlyValue(index, value) {
    setHourlyValues((current) =>
      current.map((item, i) => (i === index ? value : item))
    );
    setClassificationResult(null);
    setClusteringResult(null);
  }

  function useDemoValues() {
    setHourlyValues(DEFAULT_VALUES);
    setClassificationResult(null);
    setClusteringResult(null);
    setError("");
  }

  function clearValues() {
    setHourlyValues(Array(24).fill(""));
    setClassificationResult(null);
    setClusteringResult(null);
    setError("");
  }

  function saveHistory(type, result) {
    const record = {
      id: Date.now(),
      type,
      date: new Date().toLocaleString(),
      averageAQI: Number(averageAQI.toFixed(2)),
      status,
      result,
    };

    const updated = [record, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem("aqi_history", JSON.stringify(updated));
  }

  async function handleClassification() {
    setError("");
    setClassificationLoading(true);

    try {
      const requestData = {};

      values.forEach((value, index) => {
        requestData[`hour_${String(index).padStart(2, "0")}`] = value;
      });

      console.log("Classification request:", requestData);

      const response = await fetch(CLASSIFICATION_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Classification API returned ${response.status}`);
      }

      const data = await response.json();
      console.log("Classification response:", data);
      setClassificationResult(data);
      saveHistory("Classification", data);
    } catch (err) {
      console.error("Classification error:", err);
      setError("Unable to connect to the Classification API.");
    } finally {
      setClassificationLoading(false);
    }
  }

  async function handleClustering() {
    setError("");
    setClusteringLoading(true);

    try {
      const requestData = {};

      values.forEach((value, index) => {
        requestData[`hour_${String(index).padStart(2, "0")}`] = value;
      });

      console.log("Clustering request:", requestData);

      const response = await fetch(CLUSTERING_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Clustering API returned ${response.status}`);
      }

      const data = await response.json();
      console.log("Clustering response:", data);
      setClusteringResult(data);
      saveHistory("Clustering", data);
    } catch (err) {
      console.error("Clustering error:", err);
      setError("Unable to connect to the Clustering API.");
    } finally {
      setClusteringLoading(false);
    }
  }

  function handleLogin(event) {
    event.preventDefault();
    setError("");

    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      localStorage.setItem("aqi_logged_in", "true");
      localStorage.setItem("aqi_current_user", JSON.stringify(DEMO_USER));
      setLoggedIn(true);
      setPage("home");
      return;
    }

    let savedUser = null;
    try {
      savedUser = JSON.parse(localStorage.getItem("aqi_user") || "null");
    } catch {
      savedUser = null;
    }

    if (
      savedUser &&
      email === savedUser.email &&
      password === savedUser.password
    ) {
      localStorage.setItem("aqi_logged_in", "true");
      localStorage.setItem("aqi_current_user", JSON.stringify(savedUser));
      setLoggedIn(true);
      setPage("home");
      return;
    }

    setError(
      "Invalid email or password. Use the demo account shown below."
    );
  }

  function handleSignup(event) {
    event.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const newUser = { name, email, password };

    localStorage.setItem("aqi_user", JSON.stringify(newUser));
    localStorage.setItem("aqi_logged_in", "true");
    localStorage.setItem("aqi_current_user", JSON.stringify(newUser));

    setLoggedIn(true);
    setPage("home");
  }

  function handleLogout() {
    localStorage.removeItem("aqi_logged_in");
    localStorage.removeItem("aqi_current_user");
    setLoggedIn(false);
    setPage("home");
    setEmail("");
    setPassword("");
  }

  let currentUser = DEMO_USER;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("aqi_current_user") ||
        JSON.stringify(DEMO_USER)
    );
  } catch {
    currentUser = DEMO_USER;
  }

  if (!loggedIn) {
    return (
      <>
        <style>{CSS}</style>
        <div className="auth-page">
          <div className="auth-left">
            <div className="auth-brand">
              <div className="brand-logo">AQ</div>
              <div>
                <div className="brand-title">AQI Platform</div>
                <div className="brand-subtitle">
                  Smart Air Quality Analytics
                </div>
              </div>
            </div>

            <div className="auth-content">
              <div className="eyebrow">AIR QUALITY INTELLIGENCE</div>
              <h1>
                Smarter insights for
                <br />
                cleaner air.
              </h1>
              <p>
                Analyse 24-hour AQI observations using machine learning
                classification and clustering models.
              </p>

              <div className="feature-list">
                <div className="feature-item">✓ AQI Classification</div>
                <div className="feature-item">✓ AQI Clustering</div>
                <div className="feature-item">✓ 24-Hour Analysis</div>
                <div className="feature-item">✓ Analysis History</div>
              </div>
            </div>

            <div className="auth-footer">AQI Analytics Platform</div>
          </div>

          <div className="auth-right">
            <div className="auth-card">
              <div className="brand-logo mobile-logo">AQ</div>

              <h2>
                {authMode === "signin"
                  ? "Welcome back"
                  : "Create your account"}
              </h2>

              <p className="auth-description">
                {authMode === "signin"
                  ? "Sign in to access your AQI dashboard."
                  : "Create an account to use the AQI platform."}
              </p>

              {error && <div className="error-box">{error}</div>}

              <form
                onSubmit={
                  authMode === "signin" ? handleLogin : handleSignup
                }
              >
                {authMode === "signup" && (
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>

                <button className="primary-button full" type="submit">
                  {authMode === "signin" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <div className="auth-switch">
                {authMode === "signin"
                  ? "Don't have an account?"
                  : "Already have an account?"}

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(
                      authMode === "signin" ? "signup" : "signin"
                    );
                    setError("");
                  }}
                >
                  {authMode === "signin" ? " Sign Up" : " Sign In"}
                </button>
              </div>

              <div className="demo-box">
                <strong>Demo Account</strong>
                <br />
                Email: admin@aqiplatform.com
                <br />
                Password: AQI@123
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-logo small">AQ</div>
            <div>
              <div className="sidebar-title">AQI Platform</div>
              <div className="sidebar-subtitle">ML Analytics</div>
            </div>
          </div>

          <div className="nav-section-title">MAIN MENU</div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${page === "home" ? "active" : ""}`}
              onClick={() => setPage("home")}
            >
              <span>⌂</span>
              Dashboard
            </button>

            <button
              className={`nav-item ${
                page === "applications" ? "active" : ""
              }`}
              onClick={() => setPage("applications")}
            >
              <span>▦</span>
              Applications
            </button>

            <button
              className={`nav-item ${page === "analysis" ? "active" : ""}`}
              onClick={() => setPage("analysis")}
            >
              <span>◉</span>
              AQI Analysis
            </button>

            <button
              className={`nav-item ${page === "history" ? "active" : ""}`}
              onClick={() => setPage("history")}
            >
              <span>◷</span>
              History
            </button>

            <div className="nav-section-title second">SUPPORT</div>

            <button
              className={`nav-item ${page === "help" ? "active" : ""}`}
              onClick={() => setPage("help")}
            >
              <span>?</span>
              Help & Support
            </button>

            <button
              className={`nav-item ${page === "settings" ? "active" : ""}`}
              onClick={() => setPage("settings")}
            >
              <span>⚙</span>
              Settings
            </button>
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <div className="avatar">
                {(currentUser.name || "A").charAt(0).toUpperCase()}
              </div>

              <div className="user-details">
                <strong>{currentUser.name || "AQI Admin"}</strong>
                <span>{currentUser.email}</span>
              </div>
            </div>

            <button className="logout-button" onClick={handleLogout}>
              ↪ Sign Out
            </button>
          </div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <div>
              <div className="breadcrumb">
                AQI Platform / <strong>{getPageTitle(page)}</strong>
              </div>
              <h1>{getPageTitle(page)}</h1>
            </div>

            <div className="topbar-user">
              <div className="topbar-avatar">
                {(currentUser.name || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{currentUser.name || "AQI Admin"}</strong>
                <span>Administrator</span>
              </div>
            </div>
          </header>

          <section className="content">
            {page === "home" && (
              <HomePage
                averageAQI={averageAQI}
                status={status}
                setPage={setPage}
                history={history}
              />
            )}

            {page === "applications" && (
              <ApplicationsPage setPage={setPage} />
            )}

            {page === "analysis" && (
              <AnalysisPage
                hourlyValues={hourlyValues}
                updateHourlyValue={updateHourlyValue}
                useDemoValues={useDemoValues}
                clearValues={clearValues}
                averageAQI={averageAQI}
                status={status}
                classificationResult={classificationResult}
                clusteringResult={clusteringResult}
                classificationLoading={classificationLoading}
                clusteringLoading={clusteringLoading}
                handleClassification={handleClassification}
                handleClustering={handleClustering}
                error={error}
              />
            )}

            {page === "history" && (
              <HistoryPage history={history} setHistory={setHistory} />
            )}

            {page === "help" && <HelpPage />}

            {page === "settings" && (
              <SettingsPage
                user={currentUser}
                handleLogout={handleLogout}
              />
            )}
          </section>

          <footer className="footer">
            <span>© 2026 AQI Analytics Platform</span>
            <span>Machine Learning • Air Quality Intelligence</span>
          </footer>
        </main>
      </div>
    </>
  );
}

function HomePage({ averageAQI, status, setPage, history }) {
  return (
    <div>
      <div className="welcome-section">
        <div>
          <div className="eyebrow">OVERVIEW</div>
          <h2>Welcome to your AQI Dashboard</h2>
          <p>
            Monitor air quality and run machine learning analysis from one
            platform.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setPage("analysis")}
        >
          Start Analysis →
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">AQ</div>
          <div>
            <span>Current Average AQI</span>
            <strong>{averageAQI.toFixed(1)}</strong>
            <small>{status}</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">24</div>
          <div>
            <span>Hourly Observations</span>
            <strong>24</strong>
            <small>Hours</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">ML</div>
          <div>
            <span>ML Applications</span>
            <strong>2</strong>
            <small>Classification + Clustering</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">H</div>
          <div>
            <span>Saved Analyses</span>
            <strong>{history.length}</strong>
            <small>History records</small>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h3>AQI Status</h3>
            <p>Current 24-hour average</p>
          </div>

          <span className={`status-badge ${getAQIClass(averageAQI)}`}>
            {status}
          </span>
        </div>

        <div className="big-aqi">{averageAQI.toFixed(1)}</div>

        <p className="muted">
          Use AQI Analysis to enter hourly observations and run machine
          learning models.
        </p>
      </div>
    </div>
  );
}

function ApplicationsPage({ setPage }) {
  return (
    <div>
      <div className="welcome-section">
        <div>
          <div className="eyebrow">MACHINE LEARNING</div>
          <h2>Applications</h2>
          <p>Choose an AQI machine learning application.</p>
        </div>
      </div>

      <div className="application-grid">
        <div className="application-card">
          <div className="application-icon">C</div>
          <h3>AQI Classification</h3>
          <p>Predict the AQI category using 24 hourly AQI observations.</p>
          <button
            className="primary-button"
            onClick={() => setPage("analysis")}
          >
            Open Classification →
          </button>
        </div>

        <div className="application-card">
          <div className="application-icon purple">C</div>
          <h3>AQI Clustering</h3>
          <p>
            Group AQI observations using the clustering machine learning
            model.
          </p>
          <button
            className="secondary-button"
            onClick={() => setPage("analysis")}
          >
            Open Clustering →
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalysisPage({
  hourlyValues,
  updateHourlyValue,
  useDemoValues,
  clearValues,
  averageAQI,
  status,
  classificationResult,
  clusteringResult,
  classificationLoading,
  clusteringLoading,
  handleClassification,
  handleClustering,
  error,
}) {
  return (
    <div>
      <div className="welcome-section">
        <div>
          <div className="eyebrow">24-HOUR AQI ANALYSIS</div>
          <h2>Air Quality Analysis</h2>
          <p>
            Enter AQI values for each hour and analyse the complete 24-hour
            observation.
          </p>
        </div>

        <div className="analysis-actions">
          <button className="secondary-button" onClick={useDemoValues}>
            Use Demo Values
          </button>

          <button className="outline-button" onClick={clearValues}>
            Clear
          </button>
        </div>
      </div>

      {error && <div className="error-box page-error">{error}</div>}

      <div className="analysis-summary">
        <div className="summary-card">
          <span>24-Hour Average</span>
          <strong>{averageAQI.toFixed(1)}</strong>
        </div>

        <div className="summary-card">
          <span>AQI Category</span>
          <strong>{status}</strong>
        </div>

        <div className="summary-card">
          <span>Observations</span>
          <strong>24 / 24</strong>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h3>Hourly AQI Observations</h3>
            <p>Enter values from Hour 00 through Hour 23.</p>
          </div>
        </div>

        <div className="hour-grid">
          {hourlyValues.map((value, index) => {
            const numericValue = value === "" ? 0 : Number(value);

            return (
              <div className="hour-card" key={index}>
                <div className="hour-title">
                  Hour {String(index).padStart(2, "0")}
                </div>

                <input
                  className="hour-input"
                  type="number"
                  min="0"
                  max="500"
                  value={value}
                  onChange={(e) =>
                    updateHourlyValue(index, e.target.value)
                  }
                  placeholder="AQI"
                />

                <div
                  className={`hour-status ${getAQIClass(numericValue)}`}
                >
                  {value === ""
                    ? "Not entered"
                    : getAQIStatus(numericValue)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="model-buttons">
        <button
          className="primary-button large"
          onClick={handleClassification}
          disabled={classificationLoading}
        >
          {classificationLoading
            ? "Analysing Classification..."
            : "Run AQI Classification"}
        </button>

        <button
          className="secondary-button large"
          onClick={handleClustering}
          disabled={clusteringLoading}
        >
          {clusteringLoading
            ? "Analysing Clustering..."
            : "Run AQI Clustering"}
        </button>
      </div>

      <div className="results-grid">
        <div className="result-card">
          <div className="result-header">
            <span>CLASSIFICATION</span>
            <div className="result-icon">C</div>
          </div>

          <h3>AQI Classification Result</h3>

          <div className="result-value">
            {getResultText(classificationResult)}
          </div>

          {!classificationResult && (
            <p className="muted">
              Run Classification to receive the ML prediction.
            </p>
          )}
        </div>

        <div className="result-card">
          <div className="result-header">
            <span>CLUSTERING</span>
            <div className="result-icon purple">C</div>
          </div>

          <h3>AQI Clustering Result</h3>

          <div className="result-value">
            {getResultText(clusteringResult)}
          </div>

          {!clusteringResult && (
            <p className="muted">
              Run Clustering to receive the ML cluster.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryPage({ history, setHistory }) {
  function clearHistory() {
    localStorage.removeItem("aqi_history");
    setHistory([]);
  }

  return (
    <div>
      <div className="welcome-section">
        <div>
          <div className="eyebrow">RECORDS</div>
          <h2>Analysis History</h2>
          <p>Previous AQI machine learning analysis results.</p>
        </div>

        {history.length > 0 && (
          <button className="outline-button" onClick={clearHistory}>
            Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">H</div>
          <h3>No analysis history</h3>
          <p>
            Your Classification and Clustering results will appear here.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div className="history-card" key={item.id}>
              <div>
                <span className="history-type">{item.type}</span>
                <h3>Average AQI: {item.averageAQI}</h3>
                <p>{item.date}</p>
              </div>

              <div className="history-result">
                <span>{item.status}</span>
                <strong>{getResultText(item.result)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HelpPage() {
  return (
    <div>
      <div className="welcome-section">
        <div>
          <div className="eyebrow">SUPPORT</div>
          <h2>Help & Support</h2>
          <p>Information about using the AQI Analytics Platform.</p>
        </div>
      </div>

      <div className="help-grid">
        <div className="help-card">
          <div className="help-number">1</div>
          <h3>Enter hourly AQI</h3>
          <p>
            Enter AQI values from Hour 00 to Hour 23 in the analysis page.
          </p>
        </div>

        <div className="help-card">
          <div className="help-number">2</div>
          <h3>Run Classification</h3>
          <p>
            Click Run AQI Classification to send the 24-hour data to the
            deployed ML API.
          </p>
        </div>

        <div className="help-card">
          <div className="help-number">3</div>
          <h3>Run Clustering</h3>
          <p>
            Click Run AQI Clustering to obtain the clustering result.
          </p>
        </div>

        <div className="help-card">
          <div className="help-number">4</div>
          <h3>View History</h3>
          <p>
            Previous results are stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ user, handleLogout }) {
  return (
    <div>
      <div className="welcome-section">
        <div>
          <div className="eyebrow">ACCOUNT</div>
          <h2>Settings</h2>
          <p>Manage your AQI Platform account.</p>
        </div>
      </div>

      <div className="settings-card">
        <div className="profile-large">
          {(user.name || "A").charAt(0).toUpperCase()}
        </div>

        <h3>{user.name || "AQI Admin"}</h3>
        <p>{user.email}</p>

        <div className="setting-row">
          <span>Account Type</span>
          <strong>Administrator</strong>
        </div>

        <div className="setting-row">
          <span>Platform</span>
          <strong>AQI Analytics</strong>
        </div>

        <button className="outline-button" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

const CSS = `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, Arial, Helvetica, sans-serif;
  background: #f5f7fb;
  color: #172033;
}

button,
input {
  font-family: inherit;
}

button {
  cursor: pointer;
}

.auth-page {
  min-height: 100vh;
  display: flex;
  background: #f5f7fb;
}

.auth-left {
  width: 48%;
  min-height: 100vh;
  padding: 45px 60px;
  background: #172554;
  color: white;
  display: flex;
  flex-direction: column;
}

.auth-right {
  width: 52%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.auth-brand,
.sidebar-brand,
.topbar-user,
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 18px;
}

.brand-logo.small {
  width: 40px;
  height: 40px;
  font-size: 15px;
}

.mobile-logo {
  display: none;
}

.brand-title {
  font-size: 19px;
  font-weight: 800;
}

.brand-subtitle,
.sidebar-subtitle {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 3px;
}

.auth-content {
  margin: auto 0;
  max-width: 550px;
}

.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.6px;
  color: #2563eb;
  margin-bottom: 10px;
}

.auth-left .eyebrow {
  color: #93c5fd;
}

.auth-content h1 {
  font-size: 46px;
  line-height: 1.08;
  margin: 10px 0 20px;
}

.auth-content p {
  color: #cbd5e1;
  line-height: 1.7;
  max-width: 500px;
}

.feature-list {
  margin-top: 30px;
}

.feature-item {
  margin: 15px 0;
  color: #e2e8f0;
}

.auth-footer {
  font-size: 12px;
  color: #94a3b8;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  background: white;
  padding: 42px;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
}

.auth-card h2 {
  margin: 0 0 8px;
  font-size: 28px;
}

.auth-description {
  color: #64748b;
  margin-bottom: 28px;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}

.form-group input,
.hour-input {
  width: 100%;
  border: 1px solid #dbe2ea;
  border-radius: 9px;
  padding: 12px 13px;
  outline: none;
  background: white;
}

.form-group input:focus,
.hour-input:focus {
  border-color: #2563eb;
}

.primary-button,
.secondary-button,
.outline-button {
  border: 0;
  border-radius: 9px;
  padding: 12px 18px;
  font-weight: 700;
  transition: 0.2s;
}

.primary-button {
  background: #2563eb;
  color: white;
}

.primary-button:hover {
  background: #1d4ed8;
}

.secondary-button {
  background: #e8eefc;
  color: #1d4ed8;
}

.outline-button {
  background: white;
  border: 1px solid #cbd5e1;
  color: #334155;
}

.primary-button.full {
  width: 100%;
  margin-top: 5px;
}

.primary-button.large,
.secondary-button.large {
  padding: 15px 25px;
  font-size: 14px;
}

.primary-button:disabled,
.secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;
  margin-top: 22px;
  font-size: 13px;
  color: #64748b;
}

.auth-switch button {
  border: 0;
  background: none;
  color: #2563eb;
  font-weight: 700;
}

.demo-box {
  margin-top: 25px;
  padding: 15px;
  border-radius: 10px;
  background: #f1f5f9;
  font-size: 12px;
  line-height: 1.7;
  color: #475569;
}

.error-box {
  padding: 12px 14px;
  margin-bottom: 18px;
  border-radius: 9px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 13px;
}

.page-error {
  margin-bottom: 20px;
}

.app-layout {
  min-height: 100vh;
  display: flex;
}

.sidebar {
  width: 245px;
  background: #0f172a;
  color: white;
  padding: 25px 16px;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
}

.sidebar-title {
  font-weight: 800;
  font-size: 15px;
}

.nav-section-title {
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.3px;
  margin: 42px 12px 12px;
}

.nav-section-title.second {
  margin-top: 28px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  border: 0;
  background: transparent;
  color: #94a3b8;
  padding: 12px;
  text-align: left;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.nav-item:hover,
.nav-item.active {
  background: #1e293b;
  color: white;
}

.sidebar-bottom {
  margin-top: auto;
}

.sidebar-user {
  padding: 14px 5px;
  border-top: 1px solid #1e293b;
}

.avatar,
.topbar-avatar {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-details strong {
  font-size: 12px;
}

.user-details span {
  font-size: 10px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-button {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #334155;
  background: transparent;
  color: #cbd5e1;
}

.main-area {
  margin-left: 245px;
  width: calc(100% - 245px);
  min-height: 100vh;
}

.topbar {
  height: 92px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 35px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breadcrumb {
  font-size: 11px;
  color: #94a3b8;
}

.topbar h1 {
  margin: 5px 0 0;
  font-size: 22px;
}

.topbar-user {
  gap: 10px;
}

.topbar-user strong,
.topbar-user span {
  display: block;
}

.topbar-user strong {
  font-size: 13px;
}

.topbar-user span {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 3px;
}

.content {
  padding: 35px;
  max-width: 1450px;
  margin: auto;
}

.welcome-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.welcome-section h2 {
  margin: 0 0 8px;
  font-size: 28px;
}

.welcome-section p {
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 45px;
  height: 45px;
  border-radius: 10px;
  background: #dbeafe;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.stat-icon.blue {
  background: #dbeafe;
  color: #2563eb;
}

.stat-icon.purple,
.application-icon.purple,
.result-icon.purple {
  background: #ede9fe;
  color: #7c3aed;
}

.stat-icon.orange {
  background: #ffedd5;
  color: #ea580c;
}

.stat-card span,
.stat-card strong,
.stat-card small {
  display: block;
}

.stat-card span {
  font-size: 11px;
  color: #64748b;
}

.stat-card strong {
  font-size: 23px;
  margin: 5px 0;
}

.stat-card small {
  color: #64748b;
  font-size: 11px;
}

.dashboard-card,
.application-card,
.result-card,
.empty-card,
.settings-card,
.help-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 25px;
}

.dashboard-card {
  margin-bottom: 22px;
}

.card-header,
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3,
.application-card h3,
.result-card h3,
.help-card h3 {
  margin: 0 0 6px;
}

.card-header p {
  color: #64748b;
  font-size: 13px;
  margin: 0;
}

.big-aqi {
  font-size: 55px;
  font-weight: 800;
  margin: 25px 0 5px;
}

.muted {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.status-badge,
.hour-status {
  display: inline-block;
  border-radius: 20px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
}

.good {
  background: #dcfce7;
  color: #166534;
}

.satisfactory {
  background: #fef9c3;
  color: #854d0e;
}

.moderate {
  background: #ffedd5;
  color: #9a3412;
}

.poor {
  background: #fee2e2;
  color: #991b1b;
}

.very-poor {
  background: #f3e8ff;
  color: #7e22ce;
}

.severe {
  background: #fee2e2;
  color: #7f1d1d;
}

.application-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.application-card p {
  color: #64748b;
  line-height: 1.6;
  min-height: 50px;
}

.application-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #dbeafe;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  margin-bottom: 18px;
}

.analysis-actions {
  display: flex;
  gap: 10px;
}

.analysis-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 22px;
}

.summary-card {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 18px;
  border-radius: 12px;
}

.summary-card span {
  color: #64748b;
  font-size: 12px;
  display: block;
}

.summary-card strong {
  font-size: 23px;
  display: block;
  margin-top: 5px;
}

.hour-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.hour-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #fafbfc;
}

.hour-title {
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 8px;
  color: #334155;
}

.hour-input {
  padding: 10px;
  font-size: 14px;
}

.hour-status {
  margin-top: 8px;
  font-size: 10px;
}

.model-buttons {
  display: flex;
  gap: 15px;
  margin: 22px 0;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.result-card {
  min-height: 220px;
}

.result-header span {
  font-size: 10px;
  letter-spacing: 1px;
  font-weight: 800;
  color: #64748b;
}

.result-icon {
  width: 36px;
  height: 36px;
  background: #dbeafe;
  color: #2563eb;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.result-value {
  margin: 22px 0 8px;
  font-size: 25px;
  font-weight: 800;
  color: #1d4ed8;
  word-break: break-word;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-type {
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.history-card h3 {
  margin: 5px 0;
}

.history-card p {
  color: #94a3b8;
  margin: 0;
  font-size: 11px;
}

.history-result {
  text-align: right;
}

.history-result span,
.history-result strong {
  display: block;
}

.history-result span {
  color: #64748b;
  font-size: 11px;
}

.history-result strong {
  margin-top: 5px;
}

.empty-card {
  text-align: center;
  padding: 70px 20px;
}

.empty-icon {
  margin: auto;
  width: 55px;
  height: 55px;
  border-radius: 50%;
  background: #dbeafe;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.help-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.help-number {
  width: 35px;
  height: 35px;
  background: #dbeafe;
  color: #2563eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  margin-bottom: 15px;
}

.help-card p {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 0;
}

.settings-card {
  max-width: 650px;
}

.profile-large {
  width: 65px;
  height: 65px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 25px;
  font-weight: 800;
}

.settings-card h3 {
  margin-bottom: 4px;
}

.settings-card > p {
  color: #64748b;
}

.setting-row {
  padding: 17px 0;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.setting-row span {
  color: #64748b;
}

.footer {
  padding: 25px 35px;
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 10px;
  border-top: 1px solid #e2e8f0;
  margin-top: 30px;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hour-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 800px) {
  .auth-left {
    display: none;
  }

  .auth-right {
    width: 100%;
  }

  .sidebar {
    width: 190px;
  }

  .main-area {
    margin-left: 190px;
    width: calc(100% - 190px);
  }

  .content {
    padding: 20px;
  }

  .topbar {
    padding: 15px 20px;
  }

  .application-grid,
  .results-grid,
  .help-grid {
    grid-template-columns: 1fr;
  }

  .hour-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .sidebar {
    width: 70px;
    padding: 15px 8px;
  }

  .sidebar-title,
  .sidebar-subtitle,
  .nav-section-title,
  .user-details,
  .logout-button {
    display: none;
  }

  .nav-item {
    justify-content: center;
    font-size: 17px;
  }

  .main-area {
    margin-left: 70px;
    width: calc(100% - 70px);
  }

  .topbar-user > div:last-child {
    display: none;
  }

  .stats-grid,
  .analysis-summary {
    grid-template-columns: 1fr;
  }

  .hour-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .welcome-section,
  .model-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .history-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .history-result {
    text-align: left;
  }

  .footer {
    flex-direction: column;
    gap: 8px;
  }

  .auth-card {
    padding: 25px;
  }
}
`;

export default App;
