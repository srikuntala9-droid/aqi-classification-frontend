import { useMemo, useState } from "react";
import "./App.css";

const hours = Array.from(
  { length: 24 },
  (_, i) => `hour_${String(i).padStart(2, "0")}`
);

const CLASSIFICATION_API =
  "https://ml-fastapi-1-gsn3.onrender.com/predict";

const CLUSTERING_API =
  "https://aqi-clustering-api.onrender.com/cluster";

const emptyValues = () =>
  Object.fromEntries(hours.map((hour) => [hour, ""]));

function App() {
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("aqi_logged_in") === "true"
  );

  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [page, setPage] = useState("home");
  const [values, setValues] = useState(emptyValues);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("aqi_history") || "[]");
    } catch {
      return [];
    }
  });

  const filledValues = useMemo(
    () => hours.map((hour) => Number(values[hour]) || 0),
    [values]
  );

  const averageAQI =
    filledValues.reduce((sum, value) => sum + value, 0) / 24;

  const maxAQI = Math.max(...filledValues);
  const minAQI = Math.min(...filledValues);

  const handleAuth = (event) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    localStorage.setItem("aqi_logged_in", "true");
    localStorage.setItem("aqi_username", username.trim());

    setLoggedIn(true);
    setError("");
  };

  const handleLogout = () => {
    localStorage.removeItem("aqi_logged_in");
    setLoggedIn(false);
    setPage("home");
    setResult("");
    setError("");
  };

  const handleChange = (hour, value) => {
    setValues((previous) => ({
      ...previous,
      [hour]: value,
    }));
  };

  const clearInputs = () => {
    setValues(emptyValues());
    setResult("");
    setError("");
  };

  const saveHistory = (type, output, average) => {
    const item = {
      id: Date.now(),
      type,
      result: output,
      average: Number(average.toFixed(2)),
      time: new Date().toLocaleString(),
    };

    setHistory((previous) => {
      const updated = [item, ...previous].slice(0, 20);
      localStorage.setItem("aqi_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handlePredict = async (type) => {
    setLoading(true);
    setResult("");
    setError("");

    try {
      const payload = Object.fromEntries(
        hours.map((hour) => [
          hour,
          Number(values[hour]) || 0,
        ])
      );

      const apiUrl =
        type === "classification"
          ? CLASSIFICATION_API
          : CLUSTERING_API;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      const output =
        type === "classification"
          ? String(
              data.prediction ?? "No classification returned"
            )
          : `Cluster ${data.cluster ?? "Unknown"}`;

      setResult(output);
      saveHistory(type, output, averageAQI);
    } catch (requestError) {
      console.error(requestError);

      setError(
        type === "classification"
          ? "Unable to connect to the Classification API."
          : "Unable to connect to the Clustering API."
      );
    } finally {
      setLoading(false);
    }
  };

  const goTo = (target) => {
    setPage(target);
    setResult("");
    setError("");
  };

  const currentUsername =
    username ||
    localStorage.getItem("aqi_username") ||
    "AQI User";

  if (!loggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="brand-large">
            <div className="brand-logo">
              AQ
            </div>

            <div>
              <h1>AQI Intelligence</h1>
              <span>Air Quality ML Platform</span>
            </div>
          </div>

          <div className="auth-hero">
            <div className="hero-tag">
              AIR QUALITY INTELLIGENCE
            </div>

            <h2>Smarter Air Quality Analysis</h2>

            <p>
              Analyze 24-hour AQI observations using
              Machine Learning classification and
              clustering models.
            </p>

            <div className="auth-features">
              <div>✓ AQI Classification</div>
              <div>✓ AQI Clustering</div>
              <div>✓ 24-Hour Analysis</div>
              <div>✓ Prediction History</div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <form
            className="login-card"
            onSubmit={handleAuth}
          >
            <div className="mobile-logo">
              AQ
            </div>

            <h2>
              {authMode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p className="muted">
              {authMode === "login"
                ? "Sign in to your AQI Intelligence account"
                : "Create an account to access the platform"}
            </p>

            <label>Username</label>

            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              className="primary-btn"
              type="submit"
            >
              {authMode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>

            <div className="auth-switch">
              {authMode === "login" ? (
                <>
                  Don't have an account?

                  <button
                    type="button"
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
                  Already have an account?

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setError("");
                    }}
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const pageTitle = {
    home: "Dashboard",
    applications: "Applications",
    classification: "AQI Classification",
    clustering: "AQI Clustering",
    analysis: "24-Hour Analysis",
    history: "Prediction History",
    settings: "Settings",
  }[page];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo small">
            AQ
          </div>

          <div>
            <strong>AQI Intelligence</strong>
            <span>ML Platform</span>
          </div>
        </div>

        <div className="nav-section-title">
          MAIN MENU
        </div>

        <button
          className={`nav-item ${
            page === "home" ? "active" : ""
          }`}
          onClick={() => goTo("home")}
        >
          <span>⌂</span>
          Home
        </button>

        <button
          className={`nav-item ${
            page === "applications" ? "active" : ""
          }`}
          onClick={() => goTo("applications")}
        >
          <span>▣</span>
          Applications
        </button>

        <button
          className={`nav-item ${
            page === "classification"
              ? "active"
              : ""
          }`}
          onClick={() => goTo("classification")}
        >
          <span>◉</span>
          AQI Classification
        </button>

        <button
          className={`nav-item ${
            page === "clustering"
              ? "active"
              : ""
          }`}
          onClick={() => goTo("clustering")}
        >
          <span>◈</span>
          AQI Clustering
        </button>

        <button
          className={`nav-item ${
            page === "analysis"
              ? "active"
              : ""
          }`}
          onClick={() => goTo("analysis")}
        >
          <span>◫</span>
          24-Hour Analysis
        </button>

        <div className="nav-section-title">
          ACCOUNT
        </div>

        <button
          className={`nav-item ${
            page === "history"
              ? "active"
              : ""
          }`}
          onClick={() => goTo("history")}
        >
          <span>◷</span>
          History
        </button>

        <button
          className={`nav-item ${
            page === "settings"
              ? "active"
              : ""
          }`}
          onClick={() => goTo("settings")}
        >
          <span>⚙</span>
          Settings
        </button>

        <div className="sidebar-bottom">
          <div className="support-card">
            <strong>Air Quality ML</strong>
            <span>AQI Intelligence</span>
            <small>
              Classification • Clustering
            </small>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            ⇥ Sign Out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <span className="breadcrumb">
              AQI Intelligence
            </span>

            <h2>{pageTitle}</h2>
          </div>

          <div className="profile">
            <div className="notification">
              ♢
            </div>

            <div className="avatar">
              {currentUsername
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {currentUsername}
              </strong>

              <small>
                ML Platform User
              </small>
            </div>
          </div>
        </header>

        <main className="content">
          {page === "home" && (
            <>
              <section className="welcome-card">
                <div>
                  <span className="hero-tag">
                    AIR QUALITY INTELLIGENCE
                  </span>

                  <h1>
                    Welcome to AQI Intelligence
                  </h1>

                  <p>
                    Analyze hourly Air Quality Index
                    observations using Machine Learning.
                  </p>

                  <button
                    className="primary-btn compact"
                    onClick={() =>
                      goTo("classification")
                    }
                  >
                    Start Analysis →
                  </button>
                </div>

                <div className="welcome-icon">
                  ◉
                </div>
              </section>

              <div className="section-title">
                <div>
                  <h2>Overview</h2>
                  <p>
                    Your AQI analysis platform at a
                    glance.
                  </p>
                </div>
              </div>

              <section className="stats-grid">
                <div className="stat-card">
                  <span className="stat-icon">
                    ◉
                  </span>

                  <div>
                    <small>
                      AVERAGE AQI
                    </small>

                    <strong>
                      {averageAQI.toFixed(1)}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">
                    ↗
                  </span>

                  <div>
                    <small>
                      MAXIMUM AQI
                    </small>

                    <strong>
                      {maxAQI}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">
                    ↘
                  </span>

                  <div>
                    <small>
                      MINIMUM AQI
                    </small>

                    <strong>
                      {minAQI}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">
                    ✓
                  </span>

                  <div>
                    <small>
                      PREDICTIONS
                    </small>

                    <strong>
                      {history.length}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="application-grid">
                <div
                  className="application-card"
                  onClick={() =>
                    goTo("classification")
                  }
                >
                  <div className="app-icon">
                    ◉
                  </div>

                  <div>
                    <h3>
                      AQI Classification
                    </h3>

                    <p>
                      Predict the air-quality
                      category.
                    </p>
                  </div>

                  <span>→</span>
                </div>

                <div
                  className="application-card"
                  onClick={() =>
                    goTo("clustering")
                  }
                >
                  <div className="app-icon">
                    ◈
                  </div>

                  <div>
                    <h3>
                      AQI Clustering
                    </h3>

                    <p>
                      Discover similar AQI
                      patterns.
                    </p>
                  </div>

                  <span>→</span>
                </div>

                <div
                  className="application-card"
                  onClick={() =>
                    goTo("analysis")
                  }
                >
                  <div className="app-icon">
                    ◫
                  </div>

                  <div>
                    <h3>
                      24-Hour Analysis
                    </h3>

                    <p>
                      Review hourly AQI
                      observations.
                    </p>
                  </div>

                  <span>→</span>
                </div>
              </section>
            </>
          )}

          {page === "applications" && (
            <>
              <div className="page-heading">
                <span className="hero-tag">
                  AQI PLATFORM
                </span>

                <h1>Applications</h1>

                <p>
                  Select a Machine Learning
                  application to begin your
                  analysis.
                </p>
              </div>

              <section className="large-app-grid">
                <div className="large-app-card">
                  <div className="large-icon">
                    ◉
                  </div>

                  <h2>
                    AQI Classification
                  </h2>

                  <p>
                    Use 24 hourly AQI values to
                    classify air quality into a
                    category.
                  </p>

                  <button
                    className="primary-btn"
                    onClick={() =>
                      goTo("classification")
                    }
                  >
                    Open Classification →
                  </button>
                </div>

                <div className="large-app-card">
                  <div className="large-icon">
                    ◈
                  </div>

                  <h2>
                    AQI Clustering
                  </h2>

                  <p>
                    Group AQI observations into
                    similar air-quality patterns.
                  </p>

                  <button
                    className="primary-btn"
                    onClick={() =>
                      goTo("clustering")
                    }
                  >
                    Open Clustering →
                  </button>
                </div>

                <div className="large-app-card">
                  <div className="large-icon">
                    ◫
                  </div>

                  <h2>
                    24-Hour Analysis
                  </h2>

                  <p>
                    Enter and inspect a complete
                    24-hour AQI profile.
                  </p>

                  <button
                    className="secondary-btn"
                    onClick={() =>
                      goTo("analysis")
                    }
                  >
                    Open Analysis →
                  </button>
                </div>
              </section>
            </>
          )}

          {(page === "classification" ||
            page === "clustering") && (
            <section className="model-page">
              <div className="model-header">
                <div>
                  <span className="hero-tag">
                    MACHINE LEARNING
                  </span>

                  <h1>
                    {page === "classification"
                      ? "AQI Classification"
                      : "AQI Clustering"}
                  </h1>

                  <p>
                    Enter 24 hourly AQI observations
                    and run the deployed Machine
                    Learning model.
                  </p>
                </div>

                <div className="model-badge">
                  {page === "classification"
                    ? "Classification Model"
                    : "Clustering Model"}
                </div>
              </div>

              <div className="input-card">
                <div className="card-title">
                  <div>
                    <h2>
                      24-Hour AQI Input
                    </h2>

                    <p>
                      Enter one AQI value for
                      each hour.
                    </p>
                  </div>

                  <button
                    className="clear-btn"
                    onClick={clearInputs}
                  >
                    Clear
                  </button>
                </div>

                <div className="hour-grid">
                  {hours.map((hour, index) => (
                    <div
                      className="hour-input"
                      key={hour}