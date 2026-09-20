import { useState } from "react";

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

const HOURS = Array.from({ length: 24 }, (_, index) => index);

function App() {
  const [page, setPage] = useState("home");

  const [isLoggedIn, setIsLoggedIn] = useState(
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

  const averageAQI =
    hourlyValues.length > 0
      ? (
          hourlyValues.reduce(
            (sum, value) => sum + Number(value || 0),
            0
          ) / hourlyValues.length
        ).toFixed(2)
      : "0";

  function getAQIStatus(value) {
    const aqi = Number(value);

    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Satisfactory";
    if (aqi <= 200) return "Moderate";
    if (aqi <= 300) return "Poor";
    if (aqi <= 400) return "Very Poor";
    return "Severe";
  }

  function getAQIClass(value) {
    const status = getAQIStatus(value);

    if (status === "Good") return "good";
    if (status === "Satisfactory") return "satisfactory";
    if (status === "Moderate") return "moderate";
    if (status === "Poor") return "poor";
    if (status === "Very Poor") return "very-poor";
    return "severe";
  }

  function getValues() {
    return hourlyValues.map((value) => Number(value) || 0);
  }

  function updateHourlyValue(index, value) {
    const updated = [...hourlyValues];
    updated[index] = value;
    setHourlyValues(updated);
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
    const item = {
      id: Date.now(),
      type,
      date: new Date().toLocaleString(),
      averageAQI,
      result,
    };

    const updated = [item, ...history].slice(0, 20);

    setHistory(updated);

    localStorage.setItem(
      "aqi_history",
      JSON.stringify(updated)
    );
  }

  async function handleClassification() {
    setError("");
    setClassificationResult(null);

    const values = getValues();

    if (values.length !== 24) {
      setError("Please enter all 24 hourly AQI values.");
      return;
    }

    if (values.some((value) => value < 0)) {
      setError("AQI values cannot be negative.");
      return;
    }

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

      saveHistory("AQI Classification", data);
    } catch (err) {
      setError(
        "Unable to connect to the AQI Classification API. Please try again."
      );
    } finally {
      setClassificationLoading(false);
    }
  }

  async function handleClustering() {
    setError("");
    setClusteringResult(null);

    const values = getValues();

    if (values.length !== 24) {
      setError("Please enter all 24 hourly AQI values.");
      return;
    }

    if (values.some((value) => value < 0)) {
      setError("AQI values cannot be negative.");
      return;
    }

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

      saveHistory("AQI Clustering", data);
    } catch (err) {
      setError(
        "Unable to connect to the AQI Clustering API. Please try again."
      );
    } finally {
      setClusteringLoading(false);
    }
  }

  function handleLogin() {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    const savedUser = JSON.parse(
      localStorage.getItem("aqi_user") || "null"
    );

    if (
      email === DEMO_USER.email &&
      password === DEMO_USER.password
    ) {
      localStorage.setItem("aqi_logged_in", "true");
      localStorage.setItem(
        "aqi_current_user",
        JSON.stringify(DEMO_USER)
      );

      setIsLoggedIn(true);
      setPage("home");
      return;
    }

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

      setIsLoggedIn(true);
      setPage("home");
      return;
    }

    setError(
      "Invalid login details. Use the demo account or your registered account."
    );
  }

  function handleSignup() {
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

    setIsLoggedIn(true);
    setPage("home");
  }

  function handleLogout() {
    localStorage.removeItem("aqi_logged_in");
    localStorage.removeItem("aqi_current_user");

    setIsLoggedIn(false);
    setPage("home");
    setEmail("");
    setPassword("");
  }

  function currentUser() {
    try {
      return JSON.parse(
        localStorage.getItem("aqi_current_user") ||
          JSON.stringify(DEMO_USER)
      );
    } catch {
      return DEMO_USER;
    }
  }

  if (!isLoggedIn) {
    return (
      <>
        <style>{styles}</style>

        <div className="auth-page">
          <div className="auth-left">
            <div className="brand-large">
              <div className="brand-logo">
                AQ
              </div>

              <div>
                <div className="brand-title">
                  AQI Platform
                </div>

                <div className="brand-subtitle">
                  Air Quality Intelligence
                </div>
              </div>
            </div>

            <div className="auth-content">
              <div className="auth-badge">
                AI POWERED AIR QUALITY
              </div>

              <h1>
                Smarter Air Quality
                <br />
                <span>Analysis Platform</span>
              </h1>

              <p>
                Analyze 24-hour AQI observations using
                machine learning classification and
                clustering models.
              </p>

              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-icon">
                    ✓
                  </span>
                  <span>
                    AQI Classification
                  </span>
                </div>

                <div className="feature-item">
                  <span className="feature-icon">
                    ✓
                  </span>
                  <span>
                    AQI Clustering
                  </span>
                </div>

                <div className="feature-item">
                  <span className="feature-icon">
                    ✓
                  </span>
                  <span>
                    24-Hour Analysis
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-right">
            <div className="auth-card">
              <div className="mobile-brand">
                <div className="brand-logo">
                  AQ
                </div>
                <span>AQI Platform</span>
              </div>

              <h2>
                {authMode === "signin"
                  ? "Welcome Back"
                  : "Create Account"}
              </h2>

              <p className="auth-description">
                {authMode === "signin"
                  ? "Sign in to continue to your AQI dashboard."
                  : "Create your AQI Platform account."}
              </p>

              {authMode === "signup" && (
                <div className="form-group">
                  <label>Full Name</label>

                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                  />
                </div>
              )}

              <div className="form-group">
                <label>Email Address</label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      authMode === "signin"
                    ) {
                      handleLogin();
                    }
                  }}
                />
              </div>

              {error && (
                <div className="error-box">
                  {error}
                </div>
              )}

              <button
                className="primary-button full-width"
                onClick={
                  authMode === "signin"
                    ? handleLogin
                    : handleSignup
                }
              >
                {authMode === "signin"
                  ? "Sign In"
                  : "Create Account"}
              </button>

              <div className="auth-switch">
                {authMode === "signin" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      className="text-button"
                      onClick={() => {
                        setAuthMode("signup");
                        setError("");
                      }}
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      className="text-button"
                      onClick={() => {
                        setAuthMode("signin");
                        setError("");
                      }}
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>

              {authMode === "signin" && (
                <div className="demo-login">
                  <strong>Demo Login</strong>

                  <div>
                    Email: admin@aqiplatform.com
                  </div>

                  <div>
                    Password: AQI@123
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  const user = currentUser();

  return (
    <>
      <style>{styles}</style>

      <div className="app-layout">

        {/* SIDEBAR */}

        <aside className="sidebar">

          <div className="sidebar-brand">
            <div className="brand-logo">
              AQ
            </div>

            <div>
              <div className="sidebar-title">
                AQI Platform
              </div>

              <div className="sidebar-subtitle">
                ML Intelligence
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">

            <div className="nav-label">
              MAIN MENU
            </div>

            <button
              className={
                page === "home"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setPage("home")}
            >
              <span>⌂</span>
              Dashboard
            </button>

            <button
              className={
                page === "applications"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                setPage("applications")
              }
            >
              <span>▦</span>
              Applications
            </button>

            <button
              className={
                page === "analysis"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setPage("analysis")}
            >
              <span>◈</span>
              AQI Analysis
            </button>

            <button
              className={
                page === "history"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setPage("history")}
            >
              <span>◷</span>
              History
            </button>

            <div className="nav-label">
              SUPPORT
            </div>

            <button
              className={
                page === "help"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setPage("help")}
            >
              <span>?</span>
              Help & Support
            </button>

            <button
              className={
                page === "settings"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setPage("settings")}
            >
              <span>⚙</span>
              Settings
            </button>
          </nav>

          <div className="sidebar-bottom">
            <div className="user-mini">
              <div className="avatar">
                {(user.name || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="user-mini-info">
                <strong>
                  {user.name || "AQI User"}
                </strong>

                <span>
                  {user.email}
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

        {/* MAIN AREA */}

        <main className="main-area">

          {/* TOPBAR */}

          <header className="topbar">

            <div>
              <div className="breadcrumb">
                AQI Platform
                <span> / </span>
                {getPageTitle(page)}
              </div>

              <h1>
                {getPageTitle(page)}
              </h1>
            </div>

            <div className="topbar-user">
              <div className="topbar-user-text">
                <strong>
                  {user.name || "AQI User"}
                </strong>

                <span>
                  Air Quality Analyst
                </span>
              </div>

              <div className="avatar large">
                {(user.name || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            </div>
          </header>

          {/* CONTENT */}

          <div className="content">

            {page === "home" && (
              <HomePage
                averageAQI={averageAQI}
                status={getAQIStatus(averageAQI)}
                setPage={setPage}
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
                updateHourlyValue={
                  updateHourlyValue
                }
                useDemoValues={useDemoValues}
                clearValues={clearValues}
                averageAQI={averageAQI}
                status={getAQIStatus(
                  averageAQI
                )}
                statusClass={getAQIClass(
                  averageAQI
                )}
                handleClassification={
                  handleClassification
                }
                handleClustering={
                  handleClustering
                }
                classificationLoading={
                  classificationLoading
                }
                clusteringLoading={
                  clusteringLoading
                }
                classificationResult={
                  classificationResult
                }
                clusteringResult={
                  clusteringResult
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

            {page === "help" && (
              <HelpPage />
            )}

            {page === "settings" && (
              <SettingsPage
                user={user}
                handleLogout={handleLogout}
              />
            )}

          </div>

          <footer className="footer">
            <span>
              © 2026 AQI Platform
            </span>

            <span>
              Air Quality Machine Learning
              Application
            </span>
          </footer>

        </main>
      </div>
    </>
  );
}


/* =========================================================
   PAGE TITLE
========================================================= */

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


/* =========================================================
   HOME PAGE
========================================================= */

function HomePage({
  averageAQI,
  status,
  setPage,
}) {
  return (
    <div className="page-container">

      <div className="welcome-section">
        <div>
          <h2>Welcome to AQI Platform 👋</h2>

          <p>
            Monitor, analyze and understand air quality
            using machine learning.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setPage("analysis")}
        >
          Start AQI Analysis →
        </button>
      </div>

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">
            🌫️
          </div>

          <div>
            <span>Current Average AQI</span>

            <strong>{averageAQI}</strong>

            <small>{status}</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            🤖
          </div>

          <div>
            <span>ML Models</span>

            <strong>2</strong>

            <small>
              Classification & Clustering
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            📊
          </div>

          <div>
            <span>Hourly Inputs</span>

            <strong>24</strong>

            <small>
              AQI observations
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ⚡
          </div>

          <div>
            <span>Analysis</span>

            <strong>Real-Time</strong>

            <small>
              API powered
            </small>
          </div>
        </div>

      </div>

      <div className="section-heading">
        <div>
          <h2>Applications</h2>

          <p>
            Choose an ML application to analyze
            your AQI data.
          </p>
        </div>
      </div>

      <div className="application-grid">

        <div className="application-card">
          <div className="application-icon">
            📈
          </div>

          <h3>AQI Classification</h3>

          <p>
            Classify air quality based on 24-hour
            AQI observations using a machine
            learning classification model.
          </p>

          <button
            className="secondary-button"
            onClick={() => setPage("analysis")}
          >
            Open Classification →
          </button>
        </div>

        <div className="application-card">
          <div className="application-icon">
            🔬
          </div>

          <h3>AQI Clustering</h3>

          <p>
            Group AQI observations into meaningful
            air-quality clusters using machine
            learning.
          </p>

          <button
            className="secondary-button"
            onClick={() => setPage("analysis")}
          >
            Open Clustering →
          </button>
        </div>

        <div className="application-card">
          <div className="application-icon">
            🕐
          </div>

          <h3>24-Hour Analysis</h3>

          <p>
            Enter hourly AQI values and analyze
            the overall air-quality condition.
          </p>

          <button
            className="secondary-button"
            onClick={() => setPage("analysis")}
          >
            Analyze 24 Hours →
          </button>
        </div>

      </div>

      <div className="info-banner">
        <div className="info-banner-icon">
          💡
        </div>

        <div>
          <h3>How it works</h3>

          <p>
            Enter 24 hourly AQI values. The platform
            sends your data to the deployed machine
            learning APIs and returns the analysis
            results instantly.
          </p>
        </div>
      </div>

    </div>
  );
}


/* =========================================================
   APPLICATIONS PAGE
========================================================= */

function ApplicationsPage({ setPage }) {
  return (
    <div/* =========================================================
   APPLICATIONS PAGE
========================================================= */

function ApplicationsPage({ setPage }) {
  return (
    <div className="page-container">

      <div className="page-intro">
        <h2>ML Applications</h2>

        <p>
          Explore the machine learning applications
          available in the AQI Platform.
        </p>
      </div>

      <div className="application-grid large">

        <div className="application-card featured">

          <div className="application-icon">
            📊
          </div>

          <h3>AQI Classification</h3>

          <p>
            Predict the AQI category from 24 hourly
            AQI observations using the deployed
            Random Forest classification model.
          </p>

          <div className="model-info">
            <span>Model</span>
            <strong>Random Forest</strong>
          </div>

          <div className="model-info">
            <span>Input</span>
            <strong>24 Hourly Values</strong>
          </div>

          <button
            className="primary-button"
            onClick={() => setPage("analysis")}
          >
            Launch Application →
          </button>

        </div>


        <div className="application-card featured">

          <div className="application-icon">
            🔵
          </div>

          <h3>AQI Clustering</h3>

          <p>
            Group air-quality observations into
            meaningful clusters using the deployed
            clustering model.
          </p>

          <div className="model-info">
            <span>Model</span>
            <strong>Clustering</strong>
          </div>

          <div className="model-info">
            <span>Clusters</span>
            <strong>2 Groups</strong>
          </div>

          <button
            className="primary-button"
            onClick={() => setPage("analysis")}
          >
            Launch Application →
          </button>

        </div>


        <div className="application-card featured">

          <div className="application-icon">
            🕐
          </div>

          <h3>24-Hour AQI Analysis</h3>

          <p>
            Analyze the complete hourly AQI pattern,
            calculate the average AQI and understand
            the air-quality condition.
          </p>

          <div className="model-info">
            <span>Input</span>
            <strong>24 Hours</strong>
          </div>

          <div className="model-info">
            <span>Output</span>
            <strong>Average AQI</strong>
          </div>

          <button
            className="primary-button"
            onClick={() => setPage("analysis")}
          >
            Start Analysis →
          </button>

        </div>

      </div>

    </div>
  );
}/* =========================================================
   AQI ANALYSIS PAGE
========================================================= */

function AnalysisPage({
  hourlyValues,
  updateHourlyValue,
  useDemoValues,
  clearValues,
  averageAQI,
  status,
  statusClass,
  handleClassification,
  handleClustering,
  classificationLoading,
  clusteringLoading,
  classificationResult,
  clusteringResult,
  error,
}) {
  return (
    <div className="page-container">

      <div className="page-intro">
        <h2>24-Hour AQI Analysis</h2>

        <p>
          Enter AQI values for each hour and run
          machine learning analysis.
        </p>
      </div>

      {error && (
        <div className="error-box analysis-error">
          {error}
        </div>
      )}

      <div className="analysis-layout">

        <div className="analysis-main">

          <div className="card">

            <div className="card-header">

              <div>
                <h3>Hourly AQI Values</h3>

                <p>
                  Enter AQI observations from Hour 0
                  to Hour 23.
                </p>
              </div>

              <div className="header-actions">

                <button
                  className="small-button"
                  onClick={useDemoValues}
                >
                  Use Demo Data
                </button>

                <button
                  className="small-button danger"
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
                    Hour {index}
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) =>
                      updateHourlyValue(
                        index,
                        e.target.value
                      )
                    }
                    placeholder="AQI"
                  />

                </div>
              ))}

            </div>

          </div>


          <div className="analysis-actions">

            <button
              className="primary-button"
              onClick={handleClassification}
              disabled={classificationLoading}
            >
              {classificationLoading
                ? "Classifying..."
                : "Run AQI Classification"}
            </button>


            <button
              className="secondary-button"
              onClick={handleClustering}
              disabled={clusteringLoading}
            >
              {clusteringLoading
                ? "Clustering..."
                : "Run AQI Clustering"}
            </button>

          </div>


          {/* CLASSIFICATION RESULT */}

          {classificationResult && (
            <div className="result-card">

              <div className="result-header">

                <div>
                  <span className="result-label">
                    CLASSIFICATION RESULT
                  </span>

                  <h3>
                    AQI Classification
                  </h3>
                </div>

                <div className="result-check">
                  ✓
                </div>

              </div>


              <div className="result-content">

                <div className="result-value">

                  {classificationResult.prediction ??
                    classificationResult.classification ??
                    classificationResult.category ??
                    classificationResult.result ??
                    "Result Available"}

                </div>

                <p>
                  The classification model has
                  processed your 24-hour AQI input.
                </p>

              </div>

            </div>
          )}


          {/* CLUSTERING RESULT */}

          {clusteringResult && (
            <div className="result-card">

              <div className="result-header">

                <div>
                  <span className="result-label">
                    CLUSTERING RESULT
                  </span>

                  <h3>
                    AQI Cluster
                  </h3>
                </div>

                <div className="result-check">
                  ✓
                </div>

              </div>


              <div className="result-content">

                <div className="result-value">

                  {clusteringResult.cluster ??
                    clusteringResult.prediction ??
                    clusteringResult.label ??
                    clusteringResult.cluster_label ??
                    clusteringResult.result ??
                    "Cluster Result Available"}

                </div>

                <p>
                  The clustering model has processed
                  your 24-hour AQI input.
                </p>

              </div>

            </div>
          )}

        </div>


        {/* RIGHT SIDEBAR */}

        <aside className="analysis-sidebar">

          <div className="aqi-summary-card">

            <span>
              AVERAGE AQI
            </span>

            <strong>
              {averageAQI}
            </strong>

            <div
              className={`aqi-status ${statusClass}`}
            >
              {status}
            </div>

            <p>
              Calculated from 24 hourly
              observations.
            </p>

          </div>


          <div className="card tips-card">

            <h3>
              Analysis Tips
            </h3>

            <ul>

              <li>
                Enter all 24 hourly values.
              </li>

              <li>
                AQI values should be zero or
                greater.
              </li>

              <li>
                Use Demo Data to test the
                application.
              </li>

              <li>
                Run classification or clustering
                after entering the values.
              </li>

            </ul>

          </div>


          <div className="card model-card">

            <h3>
              ML Models
            </h3>

            <div className="model-row">
              <span>Classification</span>
              <strong>Random Forest</strong>
            </div>

            <div className="model-row">
              <span>Clustering</span>
              <strong>ML Clustering</strong>
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}
  /* =========================================================
   AQI ANALYSIS PAGE
========================================================= */

function AnalysisPage({
  hourlyValues,
  updateHourlyValue,
  useDemoValues,
  clearValues,
  averageAQI,
  status,
  statusClass,
  handleClassification,
  handleClustering,
  classificationLoading,
  clusteringLoading,
  classificationResult,
  clusteringResult,
  error,
}) {
  return (
    <div className="page-container">

      <div className="page-intro">
        <h2>24-Hour AQI Analysis</h2>

        <p>
          Enter AQI values for each hour and run
          machine learning analysis.
        </p>
      </div>

      {error && (
        <div className="error-box analysis-error">
          {error}
        </div>
      )}

      <div className="analysis-layout">

        <div className="analysis-main">

          <div className="card">

            <div className="card-header">

              <div>
                <h3>Hourly AQI Values</h3>

                <p>
                  Enter AQI observations from Hour 0
                  to Hour 23.
                </p>
              </div>

              <div className="header-actions">

                <button
                  className="small-button"
                  onClick={useDemoValues}
                >
                  Use Demo Data
                </button>

                <button
                  className="small-button danger"
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
                    Hour {index}
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) =>
                      updateHourlyValue(
                        index,
                        e.target.value
                      )
                    }
                    placeholder="AQI"
                  />

                </div>
              ))}

            </div>

          </div>


          <div className="analysis-actions">

            <button
              className="primary-button"
              onClick={handleClassification}
              disabled={classificationLoading}
            >
              {classificationLoading
                ? "Classifying..."
                : "Run AQI Classification"}
            </button>


            <button
              className="secondary-button"
              onClick={handleClustering}
              disabled={clusteringLoading}
            >
              {clusteringLoading
                ? "Clustering..."
                : "Run AQI Clustering"}
            </button>

          </div>


          {/* CLASSIFICATION RESULT */}

          {classificationResult && (
            <div className="result-card">

              <div className="result-header">

                <div>
                  <span className="result-label">
                    CLASSIFICATION RESULT
                  </span>

                  <h3>
                    AQI Classification
                  </h3>
                </div>

                <div className="result-check">
                  ✓
                </div>

              </div>


              <div className="result-content">

                <div className="result-value">

                  {classificationResult.prediction ??
                    classificationResult.classification ??
                    classificationResult.category ??
                    classificationResult.result ??
                    "Result Available"}

                </div>

                <p>
                  The classification model has
                  processed your 24-hour AQI input.
                </p>

              </div>

            </div>
          )}


          {/* CLUSTERING RESULT */}

          {clusteringResult && (
            <div className="result-card">

              <div className="result-header">

                <div>
                  <span className="result-label">
                    CLUSTERING RESULT
                  </span>

                  <h3>
                    AQI Cluster
                  </h3>
                </div>

                <div className="result-check">
                  ✓
                </div>

              </div>


              <div className="result-content">

                <div className="result-value">

                  {clusteringResult.cluster ??
                    clusteringResult.prediction ??
                    clusteringResult.label ??
                    clusteringResult.cluster_label ??
                    clusteringResult.result ??
                    "Cluster Result Available"}

                </div>

                <p>
                  The clustering model has processed
                  your 24-hour AQI input.
                </p>

              </div>

            </div>
          )}

        </div>


        {/* RIGHT SIDEBAR */}

        <aside className="analysis-sidebar">

          <div className="aqi-summary-card">

            <span>
              AVERAGE AQI
            </span>

            <strong>
              {averageAQI}
            </strong>

            <div
              className={`aqi-status ${statusClass}`}
            >
              {status}
            </div>

            <p>
              Calculated from 24 hourly
              observations.
            </p>

          </div>


          <div className="card tips-card">

            <h3>
              Analysis Tips
            </h3>

            <ul>

              <li>
                Enter all 24 hourly values.
              </li>

              <li>
                AQI values should be zero or
                greater.
              </li>

              <li>
                Use Demo Data to test the
                application.
              </li>

              <li>
                Run classification or clustering
                after entering the values.
              </li>

            </ul>

          </div>


          <div className="card model-card">

            <h3>
              ML Models
            </h3>

            <div className="model-row">
              <span>Classification</span>
              <strong>Random Forest</strong>
            </div>

            <div className="model-row">
              <span>Clustering</span>
              <strong>ML Clustering</strong>
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}
  /* =========================================================
   HISTORY PAGE
========================================================= */

function HistoryPage({
  history,
  setHistory,
}) {
  function clearHistory() {
    setHistory([]);
    localStorage.removeItem("aqi_history");
  }

  return (
    <div className="page-container">

      <div className="page-intro history-intro">

        <div>
          <h2>Analysis History</h2>

          <p>
            View your previous AQI classification
            and clustering analysis results.
          </p>
        </div>

        {history.length > 0 && (
          <button
            className="small-button danger"
            onClick={clearHistory}
          >
            Clear History
          </button>
        )}

      </div>


      {history.length === 0 ? (

        <div className="empty-state
          /* =========================================================
   STYLES
========================================================= */

const styles = `
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

button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}


/* =========================================================
   AUTH PAGE
========================================================= */

.auth-page {
  min-height: 100vh;
  display: flex;
  background: #f5f7fb;
}

.auth-left {
  width: 55%;
  min-height: 100vh;
  padding: 50px 70px;
  background: linear-gradient(
    145deg,
    #071a33 0%,
    #0b3154 55%,
    #087f8c 100%
  );
  color: white;
  position: relative;
  overflow: hidden;
}

.auth-left::after {
  content: "";
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  right: -170px;
  bottom: -150px;
  border: 70px solid rgba(255, 255, 255, 0.05);
}

.brand-large,
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #16a6a1;
  color: white;
  font-weight: 800;
  font-size: 18px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.brand-title {
  font-size: 22px;
  font-weight: 800;
}

.brand-subtitle {
  margin-top: 3px;
  font-size: 12px;
  opacity: 0.7;
  letter-spacing: 0.5px;
}

.auth-content {
  max-width: 650px;
  margin-top: 150px;
  position: relative;
  z-index: 2;
}

.auth-badge {
  display: inline-block;
  padding: 8px 13px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}

.auth-content h1 {
  margin: 24px 0 20px;
  font-size: 48px;
  line-height: 1.12;
  letter-spacing: -1.5px;
}

.auth-content h1 span {
  color: #4dd8cf;
}

.auth-content p {
  max-width: 560px;
  font-size: 17px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.75);
}

.feature-list {
  margin-top: 35px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
}

.feature-icon {
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: rgba(77, 216, 207, 0.18);
  color: #4dd8cf;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.auth-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.auth-card {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 22px;
  padding: 42px;
  box-shadow: 0 20px 60px rgba(19, 36, 60, 0.12);
}

.mobile-brand {
  display: none;
}

.auth-card h2 {
  margin: 0 0 8px;
  font-size: 30px;
}

.auth-description {
  margin: 0 0 28px;
  color: #758197;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 19px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #344054;
}

.form-group input {
  width: 100%;
  height: 48px;
  padding: 0 15px;
  border: 1px solid #dce2eb;
  border-radius: 10px;
  outline: none;
  font-size: 14px;
  background: #fbfcfe;
}

.form-group input:focus {
  border-color: #16a6a1;
  box-shadow: 0 0 0 3px rgba(22, 166, 161, 0.1);
}

.primary-button {
  border: none;
  background: #087f8c;
  color: white;
  padding: 13px 20px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  transition: 0.2s;
}

.primary-button:hover {
  background: #066c77;
  transform: translateY(-1px);
}

.full-width {
  width: 100%;
  margin-top: 5px;
}

.secondary-button {
  border: 1px solid #0b8790;
  background: white;
  color: #087f8c;
  padding: 12px 18px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
}

.secondary-button:hover {
  background: #eefafa;
}

.text-button {
  border: none;
  background: transparent;
  color: #087f8c;
  font-weight: 700;
  padding: 0;
}

.auth-switch {
  margin-top: 22px;
  text-align: center;
  color: #758197;
  font-size: 13px;
}

.demo-login {
  margin-top: 25px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #f1f8f8;
  color: #52606d;
  font-size: 12px;
  line-height: 1.7;
}

.demo-login strong {
  display: block;
  color: #087f8c;
  margin-bottom: 3px;
}

.error-box {
  margin-bottom: 17px;
  padding: 12px 14px;
  border-radius: 9px;
  background: #fff1f1;
  color: #c62828;
  border: 1px solid #ffd2d2;
  font-size: 13px;
}


/* =========================================================
   MAIN APPLICATION
========================================================= */

.app-layout {
  min-height: 100vh;
  display: flex;
  background: #f5f7fb;
}

.sidebar {
  width: 255px;
  min-height: 100vh;
  background: #071a33;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
}

.sidebar-brand {
  padding: 25px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-title {
  font-size: 16px;
  font-weight: 800;
}

.sidebar-subtitle {
  font-size: 10px;
  color: #7d91aa;
  margin-top: 3px;
}

.sidebar-nav {
  padding: 25px 14px;
  flex: 1;
}

.nav-label {
  padding: 0 12px;
  margin: 15px 0 9px;
  color: #60758e;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
}

.nav-item {
  width: 100%;
  border: none;
  background: transparent;
  color: #aebdce;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 12px 13px;
  border-radius: 9px;
  text-align: left;
  margin-bottom: 5px;
  font-size: 13px;
  font-weight: 600;
}

.nav-item span {
  width: 20px;
  text-align: center;
  font-size: 16px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: white;
}

.nav-item.active {
  background: #087f8c;
  color: white;
}

.sidebar-bottom {
  padding: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.user-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.avatar {
  width: 37px;
  height: 37px;
  min-width: 37px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #16a6a1;
  color: white;
  font-weight: 800;
}

.avatar.large {
  width: 45px;
  height: 45px;
  min-width: 45px;
}

.user-mini-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.user-mini-info strong {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-mini-info span {
  color: #71869e;
  font-size: 10px;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-button {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #aebdce;
  border-radius: 8px;
  padding: 10px;
  font-size: 12px;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.06);
  color: white;
}

.main-area {
  margin-left: 255px;
  min-height: 100vh;
  width: calc(100% - 255px);
  display: flex;
  flex-direction: column;
}

.topbar {
  min-height: 88px;
  padding: 18px 35px;
  background: white;
  border-bottom: 1px solid #e7ebf1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.breadcrumb {
  color: #8a96a8;
  font-size: 11px;
  margin-bottom: 5px;
}

.breadcrumb span {
  margin: 0 5px;
}

.topbar h1 {
  margin: 0;
  font-size: 22px;
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.topbar-user-text strong {
  font-size: 12px;
}

.topbar-user-text span {
  margin-top: 3px;
  color: #8a96a8;
  font-size: 10px;
}

.content {
  flex: 1;
  padding: 30px 35px;
}

.page-container {
  max-width: 1400px;
  margin: auto;
}

.page-intro {
  margin-bottom: 25px;
}

.page-intro h2 {
  margin: 0 0 7px;
  font-size: 24px;
}

.page-intro p {
  margin: 0;
  color: #78869a;
  font-size: 13px;
  line-height: 1.6;
}

.footer {
  padding: 17px 35px;
  background: white;
  border-top: 1px solid #e7ebf1;
  display: flex;
  justify-content: space-between;
  color: #9aa5b4;
  font-size: 10px;
}
          /* =========================================================
   HOME PAGE
========================================================= */

.welcome-section {
  padding: 27px;
  border-radius: 17px;
  background: linear-gradient(
    120deg,
    #0a3152,
    #087f8c
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
  margin-bottom: 22px;
}

.welcome-section h2 {
  margin: 0 0 8px;
  font-size: 23px;
}

.welcome-section p {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.welcome-section .primary-button {
  background: white;
  color: #087f8c;
  white-space: nowrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border: 1px solid #e8edf3;
  border-radius: 14px;
  padding: 19px;
  display: flex;
  gap: 14px;
  align-items: center;
}

.stat-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 12px;
  background: #edf8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.stat-card span,
.stat-card small {
  display: block;
  color: #8793a5;
  font-size: 10px;
}

.stat-card strong {
  display: block;
  margin: 5px 0;
  font-size: 23px;
}

.section-heading {
  margin-bottom: 15px;
}

.section-heading h2 {
  margin: 0 0 5px;
  font-size: 19px;
}

.section-heading p {
  margin: 0;
  color: #8793a5;
  font-size: 12px;
}

.application-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 17px;
}

.application-card {
  background: white;
  border: 1px solid #e8edf3;
  border-radius: 15px;
  padding: 23px;
}

.application-card.featured {
  min-height: 290px;
}

.application-icon {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: #edf8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 17px;
}

.application-card h3 {
  margin: 0 0 8px;
  font-size: 17px;
}

.application-card p {
  color: #7b8799;
  line-height: 1.65;
  font-size: 12px;
  margin: 0 0 18px;
}

.info-banner,
.support-banner {
  margin-top: 20px;
  padding: 18px;
  border-radius: 13px;
  background: #eef8f8;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.info-banner-icon,
.support-icon {
  width: 35px;
  height: 35px;
  min-width: 35px;
  border-radius: 50%;
  background: #087f8c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.info-banner h3,
.support-banner h3 {
  margin: 0 0 5px;
  font-size: 13px;
}

.info-banner p,
.support-banner p {
  margin: 0;
  color: #637486;
  font-size: 11px;
  line-height: 1.6;
}


/* =========================================================
   CARDS
========================================================= */

.card {
  background: white;
  border: 1px solid #e8edf3;
  border-radius: 15px;
  padding: 23px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 22px;
}

.card-header h3 {
  margin: 0 0 5px;
  font-size: 17px;
}

.card-header p {
  margin: 0;
  color: #8793a5;
  font-size: 11px;
}

.header-actions {
  display: flex;
  gap: 8px;
}


/* =========================================================
   ANALYSIS PAGE
========================================================= */

.analysis-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
}

.analysis-main {
  min-width: 0;
}

.hour-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 13px;
}

.hour-input label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #69778a;
  margin-bottom: 6px;
}

.hour-input input {
  width: 100%;
  height: 40px;
  border: 1px solid #dce3ec;
  border-radius: 8px;
  padding: 0 10px;
  outline: none;
  font-size: 13px;
}

.hour-input input:focus {
  border-color: #087f8c;
  box-shadow: 0 0 0 3px rgba(8, 127, 140, 0.08);
}

.analysis-actions {
  display: flex;
  gap: 12px;
  margin: 18px 0;
}

.small-button {
  border: 1px solid #d9e0e8;
  background: white;
  color: #536274;
  padding: 9px 13px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
}

.small-button:hover {
  background: #f5f8fa;
}

.small-button.danger {
  color: #c0392b;
  border-color: #f1d4d0;
}

.analysis-error {
  margin-bottom: 18px;
}

.aqi-summary-card {
  padding: 24px;
  border-radius: 15px;
  background: linear-gradient(
    145deg,
    #0a3152,
    #087f8c
  );
  color: white;
}

.aqi-summary-card > span {
  display: block;
  font-size: 10px;
  opacity: 0.7;
  letter-spacing: 1px;
}

.aqi-summary-card strong {
  display: block;
  font-size: 42px;
  margin: 8px 0 12px;
}

.aqi-summary-card p {
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  line-height: 1.5;
}

.aqi-status {
  display: inline-block;
  padding: 6px 11px;
  border-radius: 20px;
  background: white;
  font-size: 11px;
  font-weight: 800;
}

.aqi-status.good {
  color: #238636;
}

.aqi-status.satisfactory {
  color: #568000;
}

.aqi-status.moderate {
  color: #b77900;
}

.aqi-status.poor {
  color: #c65300;
}

.aqi-status.very-poor {
  color: #b42a4b;
}

.aqi-status.severe {
  color: #8b1e1e;
}

.tips-card {
  margin-top: 16px;
}

.tips-card h3 {
  margin: 0 0 13px;
  font-size: 15px;
}

.tips-card ul {
  padding-left: 18px;
  margin: 0;
}

.tips-card li {
  color: #68778a;
  font-size: 11px;
  line-height: 1.7;
  margin-bottom: 7px;
}

.model-card {
  margin-top: 16px;
}

.model-card h3 {
  margin: 0 0 14px;
  font-size: 15px;
}

.model-row,
.model-info {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #edf0f4;
  font-size: 11px;
}

.model-row:last-child,
.model-info:last-child {
  border-bottom: none;
}

.model-row span,
.model-info span {
  color: #8793a5;
}

.model-row strong,
.model-info strong {
  color: #344054;
}

.result-card {
  margin-top: 17px;
  background: white;
  border: 1px solid #dce9ea;
  border-left: 4px solid #087f8c;
  border-radius: 13px;
  padding: 21px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-label {
  font-size: 9px;
  color: #087f8c;
  font-weight: 800;
  letter-spacing: 1px;
}

.result-header h3 {
  margin: 5px 0 0;
  font-size: 17px;
}

.result-check {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #e9f8f7;
  color: #087f8c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.result-content {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #edf0f4;
}

.result-value {
  font-size: 25px;
  font-weight: 800;
  color: #087f8c;
}

.result-content p {
  margin: 7px 0 0;
  color: #7c8898;
  font-size: 11px;
}
          /* =========================================================
   HISTORY PAGE
========================================================= */

.history-intro {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  background: white;
  border: 1px solid #e8edf3;
  border-radius: 13px;
  padding: 18px;
  display: flex;
  gap: 15px;
}

.history-icon {
  width: 43px;
  height: 43px;
  min-width: 43px;
  border-radius: 11px;
  background: #edf8f8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-details {
  flex: 1;
}

.history-title-row {
  display: flex;
  justify-content: space-between;
  gap: 15px;
}

.history-title-row h3 {
  margin: 0;
  font-size: 14px;
}

.history-date {
  color: #9aa5b4;
  font-size: 10px;
}

.history-meta {
  display: flex;
  gap: 40px;
  margin-top: 12px;
}

.history-meta span,
.history-meta strong {
  display: block;
}

.history-meta span {
  color: #9aa5b4;
  font-size: 9px;
  margin-bottom: 4px;
}

.history-meta strong {
  font-size: 12px;
  color: #344054;
}

.empty-state {
  padding: 70px 25px;
  background: white;
  border: 1px solid #e8edf3;
  border-radius: 15px;
  text-align: center;
}

.empty-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin: auto;
  background: #edf8f8;
  color: #087f8c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 25px;
}

.empty-state h3 {
  margin: 17px 0 7px;
}

.empty-state p {
  margin: 0;
  color: #8995a5;
  font-size: 12px;
}


/* =========================================================
   HELP & SUPPORT
========================================================= */

.help-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 17px;
}

.help-card {
  min-height: 190px;
}

.help-icon {
  width: 43px;
  height: 43px;
  border-radius: 11px;
  background: #edf8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 14px;
}

.help-card h3 {
  margin: 0 0 8px;
  font-size: 15px;
}

.help-card p {
  margin: 0;
  color: #78869a;
  font-size: 12px;
  line-height: 1.7;
}

.support-banner {
  margin-top: 18px;
}


/* =========================================================
   SETTINGS
========================================================= */

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.settings-card {
  min-height: 240px;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 13px;
  padding-bottom: 17px;
  border-bottom: 1px solid #edf0f4;
  margin-bottom: 5px;
}

.settings-header h3 {
  margin: 0 0 4px;
  font-size: 15px;
}

.settings-header p {
  margin: 0;
  color: #8b97a8;
  font-size: 10px;
}

.settings-avatar {
  width: 45px;
  height: 45px;
  min-width: 45px;
}

.settings-icon {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  background: #edf8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.settings-row {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 13px 0;
  border-bottom: 1px solid #edf0f4;
  font-size: 11px;
}

.settings-row span {
  color: #8995a5;
}

.settings-row strong {
  color: #344054;
  text-align: right;
}

.logout-large-button {
  margin-top: 25px;
  border: 1px solid #f0d2cf;
  background: #fff7f6;
    color: #c0392b;
    padding: 12px 18px;
    border-radius: 9px;
    font-weight: 700;
  }

  .platform-info {
    margin-top: 18px;
  }

  .platform-info h3 {
    margin: 0 0 6px;
    font-size: 15px;
  }

  .platform-info p {
    margin: 0;
    color: #7f8b9c;
    font-size: 11px;
  }

  .platform-version {
    margin-top: 13px;
    color: #a0a9b5;
    font-size: 10px;
  }


  /* =========================================================
     RESPONSIVE DESIGN
  ========================================================= */

  @media (max-width: 1100px) {

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .application-grid {
      grid-template-columns: 1fr 1fr;
    }

    .analysis-layout {
      grid-template-columns: 1fr;
    }

    .analysis-sidebar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .tips-card,
    .model-card {
      margin-top: 0;
    }

  }


  @media (max-width: 800px) {

    .auth-left {
      display: none;
    }

    .auth-right {
      padding: 20px;
    }

    .mobile-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 25px;
      font-weight: 800;
    }

    .mobile-brand .brand-logo {
      width: 40px;
      height: 40px;
    }

    .sidebar {
      width: 70px;
    }

    .sidebar-brand {
      justify-content: center;
      padding: 18px 8px;
    }

    .sidebar-brand > div:not(.brand-logo) {
      display: none;
    }

    .nav-label,
    .nav-item:not(.active) {
      font-size: 0;
    }

    .nav-item {
      justify-content: center;
      padding: 13px 5px;
    }

    .nav-item span {
      font-size: 17px;
    }

    .user-mini-info,
    .logout-button {
      display: none;
    }

    .user-mini {
      justify-content: center;
    }

    .sidebar-bottom {
      padding: 12px 8px;
    }

    .main-area {
      margin-left: 70px;
      width: calc(100% - 70px);
    }

    .topbar {
      padding: 15px 20px;
    }

    .topbar-user-text {
      display: none;
    }

    .content {
      padding: 20px;
    }

    .application-grid,
    .help-grid,
    .settings-grid {
      grid-template-columns: 1fr;
    }

    .hour-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .footer {
      padding: 15px 20px;
    }

  }


  @media (max-width: 550px) {

    .auth-card {
      padding: 27px 21px;
    }

    .auth-card h2 {
      font-size: 25px;
    }

    .welcome-section {
      flex-direction: column;
      align-items: flex-start;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .hour-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .analysis-actions {
      flex-direction: column;
    }

    .analysis-actions button {
      width: 100%;
    }

    .analysis-sidebar {
      display: block;
    }

    .tips-card,
    .model-card {
      margin-top: 16px;
    }

    .history-title-row {
      flex-direction: column;
      gap: 5px;
    }

    .history-meta {
      gap: 20px;
    }

    .footer {
      flex-direction: column;
      gap: 5px;
    }

  }

`;
