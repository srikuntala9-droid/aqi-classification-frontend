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

  /* =====================================================
     FIXED CLASSIFICATION API
     Sends hour_00 ... hour_23
     ===================================================== */

  async function handleClassification() {
    setError("");
    setClassificationLoading(true);

    try {
      const requestData = {};

      values.forEach((value, index) => {
        requestData[
          `hour_${String(index).padStart(2, "0")}`
        ] = value;
      });

      const response = await fetch(CLASSIFICATION_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
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
      console.error("Classification error:", err);

      setError(
        "Unable to connect to the Classification API."
      );
    } finally {
      setClassificationLoading(false);
    }
  }

  /* =====================================================
     FIXED CLUSTERING API
     Sends hour_00 ... hour_23
     ===================================================== */

  async function handleClustering() {
    setError("");
    setClusteringLoading(true);

    try {
      const requestData = {};

      values.forEach((value, index) => {
        requestData[
          `hour_${String(index).padStart(2, "0")}`
        ] = value;
      });

      const response = await fetch(CLUSTERING_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
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
      console.error("Clustering error:", err);

      setError(
        "Unable to connect to the Clustering API."
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
            <div className="brand-logo small">
              AQ
            </div>

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
                <strong>
                  {getPageTitle(page)}
                </strong>
              </div>

              <h1>
                {getPageTitle(page)}
              </h1>
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

                <span>
                  Administrator
                </span>
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
          <div className="stat-icon">
            AQ
          </div>

          <div>
            <span>
              Current Average AQI
            </span>

            <strong>
              {averageAQI.toFixed(1)}
            </strong>

            <small>
              {status}
            </small>
          </div>
        </div>

        <div className="stat-card">

          <div className="stat-icon blue">
            24
          </div>

          <div>
            <span>
              Hourly Observations
              );
}

export default App;
