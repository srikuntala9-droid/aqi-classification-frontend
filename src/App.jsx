import { useState } from "react";
const styles = "";
const CLASSIFICATION_API =
  "https://aqi-classification.onrender.com/predict";

const CLUSTERING_API =
  "https://ml-fastapi-s2v5.onrender.com/cluster";

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
  const status = getAQIStatus(value);
  return status.toLowerCase().replace(" ", "-");
}

function getResultText(result) {
  if (!result) return "No result";

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

  const [hourlyValues, setHourlyValues] =
    useState(DEFAULT_VALUES);

  const [classificationResult, setClassificationResult] =
    useState(null);

  const [clusteringResult, setClusteringResult] =
    useState(null);

  const [classificationLoading, setClassificationLoading] =
    useState(false);

  const [clusteringLoading, setClusteringLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("aqi_history") || "[]"
      );
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
      current.map((item, i) =>
        i === index ? value : item
      )
    );
  }

  function useDemoValues() {
    setHourlyValues(DEFAULT_VALUES);
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
    localStorage.setItem(
      "aqi_history",
      JSON.stringify(updated)
    );
  }

  async function handleClassification() {
    setError("");
    setClassificationLoading(true);

    try {
      const response = await fetch(CLASSIFICATION_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hourly_values: values,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Classification API returned ${response.status}`
        );
      }

      const data = await response.json();

      setClassificationResult(data);
      saveHistory("Classification", data);
    } catch (err) {
      setError(
        "Unable to connect to the Classification API. Please make sure the API is running."
      );
    } finally {
      setClassificationLoading(false);
    }
  }

  async function handleClustering() {
    setError("");
    setClusteringLoading(true);

    try {
      const response = await fetch(CLUSTERING_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hourly_values: values,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Clustering API returned ${response.status}`
        );
      }

      const data = await response.json();

      setClusteringResult(data);
      saveHistory("Clustering", data);
    } catch (err) {
      setError(
        "Unable to connect to the Clustering API. Please make sure the API is running."
      );
    } finally {
      setClusteringLoading(false);
    }
  }

  function handleLogin(event) {
    event.preventDefault();
    setError("");

    if (
      email === DEMO_USER.email &&
      password === DEMO_USER.password
    ) {
      localStorage.setItem("aqi_logged_in", "true");
      localStorage.setItem(
        "aqi_current_user",
        JSON.stringify(DEMO_USER)
      );
      setLoggedIn(true);
      setPage("home");
      return;
    }

    const savedUser = JSON.parse(
      localStorage.getItem("aqi_user") || "null"
    );

    if (
      savedUser &&
      email === savedUser.email &&
      password === savedUser.password
    ) {
      localStorage.setItem("aqi_logged_in", "true");
      localStorage.setItem(
        "aqi_current_user",
        JSON.stringify(savedUser)
      );
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

    const newUser = {
      name,
      email,
      password,
    };

    localStorage.setItem(
      "aqi_user",
      JSON.stringify(newUser)
    );

    localStorage.setItem("aqi_logged_in", "true");

    localStorage.setItem(
      "aqi_current_user",
      JSON.stringify(newUser)
    );

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
        <style>{styles}</style>

        <div className="auth-page">
          <div className="auth-left">
            <div className="auth-brand">
              <div className="brand-logo">AQ</div>

              <div>
                <div className="brand-title">
                  AQI Platform
                </div>

                <div className="brand-subtitle">
                  Smart Air Quality Analytics
                </div>
              </div>
            </div>

            <div className="auth-content">
              <div className="eyebrow">
                AIR QUALITY INTELLIGENCE
              </div>

              <h1>
                Smarter insights for
                <br />
                cleaner air.
              </h1>

              <p>
                Analyse 24-hour AQI observations using
                machine learning classification and
                clustering models.
              </p>

              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  AQI Classification
                </div>

                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  AQI Clustering
                </div>

                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  24-Hour Analysis
                </div>

                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  Analysis History
                </div>
              </div>
            </div>

            <div className="auth-footer">
              AQI Analytics Platform
            </div>
          </div>

          <div className="auth-right">
            <div className="auth-card">
              <div className="mobile-brand">
                <div className="brand-logo">AQ</div>
              </div>

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

              {error && (
                <div className="error-box">
                  {error}
                </div>
              )}

              <form
                onSubmit={
                  authMode === "signin"
                    ? handleLogin
                    : handleSignup
                }
              >
                {authMode === "signup" && (
                  <div className="form-group">
                    <label>Full Name</label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      placeholder="Enter your name"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Email Address</label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email"
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  className="primary-button full"
                  type="submit"
                >
                  {authMode === "signin"
                    ? "Sign In"
                    : "Create Account"}
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
                      authMode === "signin"
                        ? "signup"
                        : "signin"
                    );
                    setError("");
                  }}
                >
                  {authMode === "signin"
                    ? " Sign Up"
                    : " Sign In"}
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
      <style>{styles}</style>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-logo small">AQ</div>

            <div>
              <div className="sidebar-title">
                AQI Platform
              </div>

              <div className="sidebar-subtitle">
                ML Analytics
              </div>
            </div>
          </div>

          <div className="nav-section-title">
            MAIN MENU
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${
                page === "home" ? "active" : ""
              }`}
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
              className={`nav-item ${
                page === "analysis" ? "active" : ""
              }`}
              onClick={() => setPage("analysis")}
            >
              <span>◉</span>
              AQI Analysis
            </button>

            <button
              className={`nav-item ${
                page === "history" ? "active" : ""
              }`}
              onClick={() => setPage("history")}
            >
              <span>◷</span>
              History
            </button>

            <div className="nav-section-title second">
              SUPPORT
            </div>

            <button
              className={`nav-item ${
                page === "help" ? "active" : ""
              }`}
              onClick={() => setPage("help")}
            >
              <span>?</span>
              Help & Support
            </button>

            <button
              className={`nav-item ${
                page === "settings" ? "active" : ""
              }`}
              onClick={() => setPage("settings")}
            >
              <span>⚙</span>
              Settings
            </button>
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <div className="avatar">
                {(currentUser.name || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="user-details">
                <strong>
                  {currentUser.name || "AQI Admin"}
                </strong>

                <span>
                  {currentUser.email}
                </span>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              ↪ Sign Out
            </button>
          </div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <div>
              <div className="breadcrumb">
                AQI Platform /{" "}
                <strong>{getPageTitle(page)}</strong>
              </div>

              <h1>{getPageTitle(page)}</h1>
            </div>

            <div className="topbar-user">
              <div className="topbar-avatar">
                {(currentUser.name || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {currentUser.name || "AQI Admin"}
                </strong>
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
              <ApplicationsPage
                setPage={setPage}
              />
            )}

            {page === "analysis" && (
              <AnalysisPage
                hourlyValues={hourlyValues}
                updateHourlyValue={updateHourlyValue}
                useDemoValues={useDemoValues}
                clearValues={clearValues}
                averageAQI={averageAQI}
                status={status}
                classificationResult={
                  classificationResult
                }
                clusteringResult={
                  clusteringResult
                }
                classificationLoading={
                  classificationLoading
                }
                clusteringLoading={
                  clusteringLoading
                }
                handleClassification={
                  handleClassification
                }
                handleClustering={
                  handleClustering
                }
                error={error}
              />
            )}

            {page === "history" && (
              <HistoryPage
                history={history}
                setHistory={setHistory}
              />
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
            <span>
              © 2026 AQI Analytics Platform
            </span>

            <span>
              Machine Learning • Air Quality Intelligence
            </span>
          </footer>
        </main>
      </div>
    </>
  );
}

function HomePage({
  averageAQI,
  status,
  setPage,
  history,
}) {
  return (
    <div>
      <div className="welcome-section">
        <div>
          <div className="eyebrow">
            OVERVIEW
          </div>

          <h2>
            Welcome to your AQI Dashboard
          </h2>

          <p>
            Monitor air quality and run machine
            learning analysis from one platform.
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

            <strong>
              {averageAQI.toFixed(1)}
            </strong>

            <small>{status}</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            24
          </div>

          <div>
            <span>Hourly Observations</span>
            <strong>24</strong>
            <small>Hours analysed</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            ML
          </div>

          <div>
            <span>ML Models</span>
            <strong>02</strong>
            <small>Classification + Clustering</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            ✓
          </div>

          <div>
            <span>Saved Analyses</span>
            <strong>{history.length}</strong>
            <small>Recent records</small>
          </div>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h3>Applications</h3>
          <p>
            Choose an AQI machine learning application.
          </p>
        </div>

        <button
          className="text-button"
          onClick={()=>
              setPage("applications")
    }
  >
    View all →
  </button>
</div>

<div className="application-grid">
  <div className="application-card">
    <div className="application-icon">
      📊
    </div>

    <h3>AQI Classification</h3>

    <p>
      Classify air quality using 24-hour
      observations and a machine learning model.
    </p>

    <button
      onClick={() => setPage("analysis")}
    >
      Open Application →
    </button>
  </div>

  <div className="application-card">
    <div className="application-icon">
      🔵
    </div>

    <h3>AQI Clustering</h3>

    <p>
      Group AQI observations into meaningful
      air quality clusters.
    </p>

    <button
      onClick={() => setPage("analysis")}
    >
      Open Application →
    </button>
  </div>

  <div className="application-card">
    <div className="application-icon">
      📈
    </div>

    <h3>24-Hour Analysis</h3>

    <p>
      Enter hourly AQI values and understand
      daily air quality patterns.
    </p>

    <button
      onClick={() => setPage("analysis")}
    >
      Start Analysis →
    </button>
  </div>
</div>

<div className="info-banner">
  <div className="banner-icon">
    💡
  </div>

  <div>
    <strong>Quick Tip</strong>

    <p>
      Use the demo values to test both deployed
      machine learning APIs quickly.
    </p>
  </div>

  <button
    onClick={() => setPage("analysis")}
  >
    Try Now
  </button>
</div>
</div>
);
}

function ApplicationsPage({ setPage }) {
  const applications = [
    {
      icon: "📊",
      title: "AQI Classification",
      description:
        "Predict the AQI category from 24 hourly AQI observations.",
      action: "Run Classification",
    },
    {
      icon: "🔵",
      title: "AQI Clustering",
      description:
        "Identify the cluster associated with the supplied AQI observations.",
      action: "Run Clustering",
    },
    {
      icon: "📈",
      title: "24-Hour Analysis",
      description:
        "Review and analyse all 24 hourly AQI observations.",
      action: "Open Analysis",
    },
  ];

  return (
    <div>
      <div className="page-intro">
        <div className="eyebrow">
          APPLICATIONS
        </div>

        <h2>Machine Learning Applications</h2>

        <p>
          Select an application to analyse your
          24-hour AQI observations.
        </p>
      </div>

      <div className="large-application-grid">
        {applications.map((app) => (
          <div
            className="large-application-card"
            key={app.title}
          >
            <div className="large-app-icon">
              {app.icon}
            </div>

            <h3>{app.title}</h3>

            <p>{app.description}</p>

            <button
              className="primary-button"
              onClick={() => setPage("analysis")}
            >
              {app.action} →
            </button>
          </div>
        ))}
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
      <div className="page-intro">
        <div className="eyebrow">
          MACHINE LEARNING
        </div>

        <h2>24-Hour AQI Analysis</h2>

        <p>
          Enter AQI observations for each hour and
          run the deployed ML models.
        </p>
      </div>

      {error && (
        <div className="error-box page-error">
          {error}
        </div>
      )}

      <div className="analysis-layout">
        <div>
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Hourly AQI Observations</h3>

                <p>
                  Enter one AQI value for each hour.
                </p>
              </div>

              <div className="header-actions">
                <button
                  className="secondary-button"
                  onClick={useDemoValues}
                >
                  Use Demo Data
                </button>

                <button
                  className="clear-button"
                  onClick={clearValues}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="hour-grid">
              {hourlyValues.map((value, index) => (
                <div
                  className="hour-input"
                  key={index}
                >
                  <label>
                    {String(index).padStart(2, "0")}:00
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={value}
                    onChange={(e) =>
                      updateHourlyValue(
                        index,
                        e.target.value
                      )
                    }
                  />
                </div>
              ))}
            </div>

            <div className="analysis-actions">
              <button
                className="primary-button"
                onClick={handleClassification}
                disabled={classificationLoading}
              >
                {classificationLoading
                  ? "Classifying..."
                  : "Run Classification"}
              </button>

              <button
                className="secondary-button large"
                onClick={handleClustering}
                disabled={clusteringLoading}
              >
                {clusteringLoading
                  ? "Clustering..."
                  : "Run Clustering"}
              </button>
            </div>
          </div>

          <div className="results-grid">
            <div className="result-card">
              <div className="result-card-top">
                <span className="result-icon">
                  📊
                </span>

                <span>Classification</span>
              </div>

              <h3>
                {classificationResult
                  ? getResultText(classificationResult)
                  : "Not analysed"}
              </h3>

              <p>
                Random Forest classification API
              </p>
            </div>

            <div className="result-card">
              <div className="result-card-top">
                <span className="result-icon">
                  🔵
                </span>

                <span>Clustering</span>
              </div>

              <h3>
                {clusteringResult
                  ? getResultText(clusteringResult)
                  : "Not analysed"}
              </h3>

              <p>
                Deployed clustering API
              </p>
            </div>
          </div>
        </div>

        <aside>
          <div className="aqi-summary-card">
            <span>AVERAGE AQI</span>

            <div className="aqi-number">
              {averageAQI.toFixed(1)}
            </div>

            <div
              className={`aqi-status ${getAQIClass(
                averageAQI
              )}`}
            >
              {status}
            </div>

            <p>
              Based on 24 hourly observations
            </p>
          </div>

          <div className="tips-card">
            <h3>Analysis Guide</h3>

            <div className="tip-item">
              <span>01</span>
              Enter all 24 hourly values.
            </div>

            <div className="tip-item">
              <span>02</span>
              Use Classification to predict the AQI
              category.
            </div>

            <div className="tip-item">
              <span>03</span>
              Use Clustering to identify the group.
            </div>
          </div>

          <div className="model-card">
            <span className="model-label">
              MODEL STATUS
            </span>

            <strong>
              ● APIs Connected
            </strong>

            <p>
              Classification and clustering models
              are deployed separately.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
