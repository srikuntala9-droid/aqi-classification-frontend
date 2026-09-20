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

function App() {
  const [page, setPage] = useState("home");

  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("aqi_logged_in") === "true"
  );

  const [userName, setUserName] = useState(
    localStorage.getItem("aqi_user_name") || "AQI User"
  );

  const [authMode, setAuthMode] = useState("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");

  const [hourlyValues, setHourlyValues] = useState(
    Array(24).fill("")
  );

  const [classificationResult, setClassificationResult] =
    useState(null);

  const [clusteringResult, setClusteringResult] =
    useState(null);

  const [loadingClassification, setLoadingClassification] =
    useState(false);

  const [loadingClustering, setLoadingClustering] =
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

  const updateValue = (index, value) => {
    const updated = [...hourlyValues];
    updated[index] = value;
    setHourlyValues(updated);
  };

  const getValues = () => {
    return hourlyValues.map((value) => Number(value));
  };

  const validateValues = () => {
    if (hourlyValues.some((value) => value === "")) {
      setError("Please enter all 24 hourly AQI values.");
      return false;
    }

    const numbers = getValues();

    if (numbers.some((value) => Number.isNaN(value))) {
      setError("Please enter valid numeric AQI values.");
      return false;
    }

    if (numbers.some((value) => value < 0)) {
      setError("AQI values cannot be negative.");
      return false;
    }

    return true;
  };

  const saveHistory = (type, result) => {
    const item = {
      id: Date.now(),
      type,
      date: new Date().toLocaleString(),
      result,
    };

    const updated = [item, ...history].slice(0, 20);

    setHistory(updated);

    localStorage.setItem(
      "aqi_history",
      JSON.stringify(updated)
    );
  };

  const classifyAQI = async () => {
    setError("");
    setClassificationResult(null);

    if (!validateValues()) return;

    setLoadingClassification(true);

    try {
      const response = await fetch(CLASSIFICATION_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hourly_values: getValues(),
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
      console.error(err);
      setError(
        "Unable to connect to the Classification API."
      );
    } finally {
      setLoadingClassification(false);
    }
  };

  const clusterAQI = async () => {
    setError("");
    setClusteringResult(null);

    if (!validateValues()) return;

    setLoadingClustering(true);

    try {
      const response = await fetch(CLUSTERING_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hourly_values: getValues(),
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
      console.error(err);
      setError(
        "Unable to connect to the Clustering API."
      );
    } finally {
      setLoadingClustering(false);
    }
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setAuthError("");

    const savedEmail =
      localStorage.getItem("aqi_user_email");

    const savedPassword =
      localStorage.getItem("aqi_user_password");

    const savedName =
      localStorage.getItem("aqi_user_name");

    const validEmail =
      email === DEMO_USER.email ||
      email === savedEmail;

    const validPassword =
      password === DEMO_USER.password ||
      password === savedPassword;

    if (validEmail && validPassword) {
      const finalName =
        savedName ||
        (email === DEMO_USER.email
          ? DEMO_USER.name
          : "AQI User");

      localStorage.setItem("aqi_logged_in", "true");
      localStorage.setItem(
        "aqi_user_name",
        finalName
      );

      setUserName(finalName);
      setLoggedIn(true);
      setPage("home");
      setEmail("");
      setPassword("");
    } else {
      setAuthError(
        "Invalid email or password. Use the demo account shown below."
      );
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setAuthError("");

    if (!name || !email || !password) {
      setAuthError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setAuthError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    localStorage.setItem("aqi_user_name", name);
    localStorage.setItem("aqi_user_email", email);
    localStorage.setItem("aqi_user_password", password);
    localStorage.setItem("aqi_logged_in", "true");

    setUserName(name);
    setLoggedIn(true);
    setPage("home");

    setName("");
    setEmail("");
    setPassword("");
  };

  const signOut = () => {
    localStorage.removeItem("aqi_logged_in");
    setLoggedIn(false);
    setPage("home");
    setClassificationResult(null);
    setClusteringResult(null);
  };

  const clearInputs = () => {
    setHourlyValues(Array(24).fill(""));
    setClassificationResult(null);
    setClusteringResult(null);
    setError("");
  };

  const fillDemoValues = () => {
    setHourlyValues([
      50, 52, 55, 58, 60, 62,
      65, 68, 70, 72, 75, 78,
      80, 82, 85, 88, 90, 92,
      95, 98, 100, 102, 105, 108,
    ]);

    setError("");
  };

  const averageAQI =
    hourlyValues.every((value) => value !== "")
      ? (
          getValues().reduce(
            (sum, value) => sum + value,
            0
          ) / 24
        ).toFixed(2)
      : "--";

  const getAQIStatus = (value) => {
    if (value === "--") return "Waiting";
    if (value <= 50) return "Good";
    if (value <= 100) return "Satisfactory";
    if (value <= 200) return "Moderate";
    if (value <= 300) return "Poor";
    if (value <= 400) return "Very Poor";
    return "Severe";
  };

  if (!loggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="brand-large">🌿</div>

          <h1>AQI Air Quality Platform</h1>

          <p>
            AI-powered air quality analysis,
            classification and clustering.
          </p>

          <div className="auth-features">
            <div>✓ AQI Classification</div>
            <div>✓ AQI Clustering</div>
            <div>✓ 24-Hour Analysis</div>
            <div>✓ Analysis History</div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={
                authMode === "signin"
                  ? "active-tab"
                  : ""
              }
              onClick={() => {
                setAuthMode("signin");
                setAuthError("");
              }}
            >
              Sign In
            </button>

            <button
              className={
                authMode === "signup"
                  ? "active-tab"
                  : ""
              }
              onClick={() => {
                setAuthMode("signup");
                setAuthError("");
              }}
            >
              Sign Up
            </button>
          </div>

          <h2>
            {authMode === "signin"
              ? "Welcome Back"
              : "Create Account"}
          </h2>

          <p className="auth-subtitle">
            {authMode === "signin"
              ? "Sign in to access your AQI dashboard."
              : "Create your AQI platform account."}
          </p>

          <form
            onSubmit={
              authMode === "signin"
                ? handleSignIn
                : handleSignUp
            }
          >
            {authMode === "signup" && (
              <>
                <label>Full Name</label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />
              </>
            )}

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            {authError && (
              <div className="auth-error">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              className="auth-button"
            >
              {authMode === "signin"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {authMode === "signin" && (
            <div className="demo-login">
              <strong>Demo Login</strong>
              <br />
              Email: admin@aqiplatform.com
              <br />
              Password: AQI@123
            </div>
          )}
        </div>

        <style>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
          }

          .auth-page {
            min-height: 100vh;
            display: grid;
            grid-template-columns: 1fr 1fr;
            background: linear-gradient(
              135deg,
              #102a43,
              #1d4d72
            );
          }

          .auth-left {
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 8%;
          }

          .brand-large {
            width: 78px;
            height: 78px;
            border-radius: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.14);
            font-size: 40px;
            margin-bottom: 25px;
          }

          .auth-left h1 {
            font-size: 42px;
            margin: 0 0 15px;
          }

          .auth-left > p {
            font-size: 18px;
            line-height: 1.6;
            opacity: 0.85;
            max-width: 520px;
          }

          .auth-features {
            margin-top: 35px;
            display: grid;
            gap: 15px;
          }

          .auth-card {
            align-self: center;
            width: min(470px, 90%);
            margin: auto;
            padding: 40px;
            background: white;
            border-radius: 24px;
            box-shadow: 0 25px 70px rgba(0,0,0,0.25);
          }

          .auth-tabs {
            display: flex;
            gap: 8px;
            background: #f1f4f8;
            padding: 5px;
            border-radius: 10px;
            margin-bottom: 30px;
          }

          .auth-tabs button {
            flex: 1;
            padding: 11px;
            border: 0;
            background: transparent;
            border-radius: 8px;
            font-weight: 600;
          }

          .auth-tabs .active-tab {
            background: white;
            color: #1d4d72;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }

          .auth-card h2 {
            margin: 0;
            font-size: 29px;
          }

          .auth-subtitle {
            color: #667085;
            margin-bottom: 25px;
          }

          .auth-card form {
            display: grid;
            gap: 9px;
          }

          .auth-card label {
            margin-top: 7px;
            font-size: 13px;
            font-weight: 700;
          }

          .auth-card input {
            width: 100%;
            padding: 13px;
            border: 1px solid #d9e0ea;
            border-radius: 9px;
            outline: none;
          }

          .auth-button {
            margin-top: 16px;
            padding: 14px;
            border: 0;
            border-radius: 10px;
            background: #1d4d72;
            color: white;
            font-weight: 700;
          }

          .auth-error {
            padding: 11px;
            background: #fff1f0;
            color: #cf1322;
            border-radius: 8px;
            font-size: 13px;
          }

          .demo-login {
            margin-top: 20px;
            padding: 13px;
            background: #f4f7fb;
            border-radius: 9px;
            color: #667085;
            font-size: 12px;
            line-height: 1.7;
          }

          @media (max-width: 800px) {
            .auth-page {
              grid-template-columns: 1fr;
            }

            .auth-left {
              padding: 40px;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">🌿</div>

          <div>
            <h1>AQI Platform</h1>
            <span>
              Air Quality Intelligence
            </span>
          </div>
        </div>

        <div className="top-user">
          <div className="avatar">
            {userName.charAt(0).toUpperCase()}
          </div>

          <span>{userName}</span>

          <button
            className="logout-small"
            onClick={signOut}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="menu-title">
            MAIN MENU
          </div>

          <button
            className={
              page === "home"
                ? "menu-item selected"
                : "menu-item"
            }
            onClick={() => setPage("home")}
          >
            🏠 <span>Home</span>
          </button>

          <button
            className={
              page === "applications"
                ? "menu-item selected"
                : "menu-item"
            }
            onClick={() =>
              setPage("applications")
            }
          >
            📱 <span>Applications</span>
          </button>

          <button
            className={
              page === "analysis"
                ? "menu-item selected"
                : "menu-item"
            }
            onClick={() => setPage("analysis")}
          >
            ⏱️ <span>24-Hour Analysis</span>
          </button>

          <button
            className={
              page === "history"
                ? "menu-item selected"
                : "menu-item"
            }
            onClick={() => setPage("history")}
          >
            📜 <span>History</span>
          </button>

          <div className="menu-title second">
            SUPPORT
          </div>

          <button
            className={
              page === "help"
                ? "menu-item selected"
                : "menu-item"
            }
            onClick={() => setPage("help")}
          >
            ❓ <span>Help</span>
          </button>

          <button
            className={
              page === "settings"
                ? "menu-item selected"
                : "menu-item"
            }
            onClick={() =>
              setPage("settings")
            }
          >
            ⚙️ <span>Settings</span>
          </button>

          <div className="sidebar-bottom">
            <div className="api-status">
              🟢 ML APIs Connected
            </div>

            <button
              className="signout-button"
              onClick={signOut}
            >
              🚪 Sign Out
            </button>
          </div>
        </aside>

        <main className="main-content">
          {page === "home" && (
            <>
              <div className="welcome">
                <div>
                  <span className="eyebrow">
                    AIR QUALITY DASHBOARD
                  </span>

                  <h2>
                    Welcome back, {userName}! 👋
                  </h2>

                  <p>
                    Monitor, classify and analyze
                    air quality using machine
                    learning.
                  </p>
                </div>

                <div className="date-card">
                  <span>Today</span>

                  <strong>
                    {new Date().toLocaleDateString()}
                  </strong>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    📊
                  </div>

                  <div>
                    <span>Average AQI</span>

                    <strong>
                      {averageAQI}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">
                    🌿
                  </div>

                  <div>
                    <span>AQI Status</span>

                    <strong>
                      {getAQIStatus(averageAQI)}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon purple">
                    📜
                  </div>

                  <div>
                    <span>Analyses</span>

                    <strong>
                      {history.length}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">
                    🤖
                  </div>

                  <div>
                    <span>ML Models</span>

                    <strong>2</strong>
                  </div>
                </div>
              </div>

              <h3>Quick Applications</h3>

              <div className="application-grid">
                <button
                  className="application-card"
                  onClick={() =>
                    setPage("analysis")
                  }
                >
                  <div className="app-icon blue-bg">
                    📊
                  </div>

                  <h3>
                    AQI Classification
                  </h3>

                  <p>
                    Predict the AQI category
                    using the trained
                    classification model.
                  </p>

                  <span>
                    Start Analysis →
                  </span>
                <button
                  className="application-card"
                  onClick={() =>
                    setPage("analysis")
                  }
                >
                  <div className="app-icon dark-bg">
                    🔵
                  </div>

                  <h3>
                    AQI Clustering
                  </h3>

                  <p>
                    Group AQI patterns using
                    the trained clustering
                    model.
                  </p>

                  <span>
                    Start Clustering →
                  </span>
                </button>

                <button
                  className="application-card"
                  onClick={() =>
                    setPage("analysis")
                  }
                >
                  <div className="app-icon green-bg">
                    ⏱️
                  </div>

                  <h3>
                    24-Hour Analysis
                  </h3>

                  <p>
                    Analyze 24 hourly AQI
                    observations.
                  </p>

                  <span>
                    Analyze Now →
                  </span>
                </button>
              </div>
            </>
          )}

          {page === "applications" && (
            <>
              <PageHeader
                title="Applications"
                subtitle="Choose an AQI machine learning application."
              />

              <div className="application-grid">
                <button
                  className="application-card"
                  onClick={() =>
                    setPage("analysis")
                  }
                >
                  <div className="app-icon blue-bg">
                    📊
                  </div>

                  <h3>AQI Classification</h3>

                  <p>
                    Classify air quality using
                    24 hourly AQI values.
                  </p>

                  <span>Open →</span>
                </button>

                <button
                  className="application-card"
                  onClick={() =>
                    setPage("analysis")
                  }
                >
                  <div className="app-icon dark-bg">
                    🔵
                  </div>

                  <h3>AQI Clustering</h3>

                  <p>
                    Identify the AQI cluster
                    using the trained model.
                  </p>

                  <span>Open →</span>
                </button>

                <button
                  className="application-card"
                  onClick={() =>
                    setPage("analysis")
                  }
                >
                  <div className="app-icon green-bg">
                    ⏱️
                  </div>

                  <h3>24-Hour Analysis</h3>

                  <p>
                    Analyze the complete
                    24-hour AQI pattern.
                  </p>

                  <span>Open →</span>
                </button>
              </div>
            </>
          )}

          {page === "analysis" && (
            <>
              <PageHeader
                title="24-Hour AQI Analysis"
                subtitle="Enter hourly AQI values and run your machine learning models."
              />

              {error && (
                <div className="error-box">
                  ⚠️ {error}
                </div>
              )}

              <div className="analysis-summary">
                <div>
                  <span>Average AQI</span>
                  <strong>{averageAQI}</strong>
                </div>

                <div>
                  <span>AQI Status</span>
                  <strong>
                    {getAQIStatus(averageAQI)}
                  </strong>
                </div>

                <div>
                  <span>Observations</span>
                  <strong>24</strong>
                </div>
              </div>

              <div className="analysis-panel">
                <div className="panel-header">
                  <div>
                    <h3>Hourly AQI Input</h3>

                    <p>
                      Enter AQI values from
                      Hour 1 to Hour 24.
                    </p>
                  </div>

                  <div>
                    <button
                      className="demo-button"
                      onClick={fillDemoValues}
                    >
                      Use Demo Data
                    </button>

                    <button
                      className="clear-button"
                      onClick={clearInputs}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="hour-grid">
                  {hourlyValues.map(
                    (value, index) => (
                      <div
                        className="hour-input"
                        key={index}
                      >
                        <label>
                          Hour {index + 1}
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={value}
                          placeholder="AQI"
                          onChange={(e) =>
                            updateValue(
                              index,
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )
                  )}
                </div>

                <div className="model-buttons">
                  <button
                    className="classification-button"
                    onClick={classifyAQI}
                    disabled={
                      loadingClassification
                    }
                  >
                    {loadingClassification
                      ? "Classifying..."
                      : "📊 Run Classification"}
                  </button>

                  <button
                    className="clustering-button"
                    onClick={clusterAQI}
                    disabled={
                      loadingClustering
                    }
                  >
                    {loadingClustering
                      ? "Clustering..."
                      : "🔵 Run Clustering"}
                  </button>
                </div>
              </div>

              {classificationResult && (
                <ResultCard
                  title="CLASSIFICATION RESULT"
                  icon="📊"
                  result={classificationResult}
                />
              )}

              {clusteringResult && (
                <ResultCard
                  title="CLUSTERING RESULT"
                  icon="🔵"
                  result={clusteringResult}
                />
              )}
            </>
          )}

          {page === "history" && (
            <>
              <PageHeader
                title="Analysis History"
                subtitle="Your recent AQI machine learning analyses."
              />

              {history.length === 0 ? (
                <div className="empty-card">
                  <div>📜</div>

                  <h3>
                    No analysis history
                  </h3>

                  <p>
                    Run Classification or
                    Clustering to create your
                    first history entry.
                  </p>

                  <button
                    onClick={() =>
                      setPage("analysis")
                    }
                  >
                    Start Analysis
                  </button>
                </div>
              ) : (
                <div className="history-list">
                  {history.map((item) => (
                    <div
                      className="history-item"
                      key={item.id}
                    >
                      <div className="history-icon">
                        {item.type ===
                        "Classification"
                          ? "📊"
                          : "🔵"}
                      </div>

                      <div className="history-main">
                        <strong>
                          {item.type}
                        </strong>

                        <span>
                          {item.date}
                        </span>
                      </div>

                      <div className="history-result">
                        {item.result.prediction ??
                          item.result.predicted_category ??
                          item.result.category ??
                          item.result.cluster ??
                          item.result.cluster_label ??
                          "Result available"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {page === "help" && (
            <>
              <PageHeader
                title="Help & Support"
                subtitle="Learn how to use the AQI Air Quality Platform."
              />

              <div className="help-grid">
                <div className="help-card">
                  <div>🔐</div>
                  <h3>Sign In</h3>
                  <p>
                    Use your registered email
                    and password to access
                    the platform.
                  </p>
                </div>

                <div className="help-card">
                  <div>📊</div>
                  <h3>Classification</h3>
                  <p>
                    Enter 24 hourly AQI
                    values and run
                    Classification.
                  </p>
                </div>

                <div className="help-card">
                  <div>🔵</div>
                  <h3>Clustering</h3>
                  <p>
                    Enter 24 hourly AQI
                    values and run Clustering.
                  </p>
                </div>

                <div className="help-card">
                  <div>📜</div>
                  <h3>History</h3>
                  <p>
                    Recent model results are
                    saved in your browser.
                  </p>
                </div>

                <div className="help-card">
                  <div>💡</div>
                  <h3>Demo Data</h3>
                  <p>
                    Use Demo Data to fill all
                    24 AQI fields automatically.
                  </p>
                </div>

                <div className="help-card">
                  <div>🚪</div>
                  <h3>Sign Out</h3>
                  <p>
                    Use Sign Out whenever you
                    want to leave the platform.
                  </p>
                </div>
              </div>
            </>
          )}

          {page === "settings" && (
            <>
              <PageHeader
                title="Settings"
                subtitle="Manage your AQI platform account."
              />

              <div className="settings-card">
                <div className="profile-avatar">
                  {userName
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <span className="setting-label">
                    USER NAME
                  </span>

                  <h3>{userName}</h3>
                </div>
              </div>

              <div className="settings-card">
                <div className="setting-icon">
                  🤖
                </div>

                <div>
                  <span className="setting-label">
                    PLATFORM
                  </span>

                  <h3>
                    AQI Air Quality ML Platform
                  </h3>

                  <p>
                    Classification and
                    Clustering APIs are connected.
                  </p>
                </div>
              </div>

              <div className="settings-card">
                <div className="setting-icon">
                  🚪
                </div>

                <div>
                  <h3>Sign Out</h3>

                  <p>
                    Sign out of the current account.
                  </p>

                  <button
                    className="danger-button"
                    onClick={signOut}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <footer className="footer">
        AQI Air Quality ML Platform
        <span>•</span>
        Classification
        <span>•</span>
        Clustering
        <span>•</span>
        24-Hour Analysis
      </footer>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #f5f7fa;
          color: #172033;
        }

        button,
        input {
          font-family: inherit;
        }

        button {
          cursor: pointer;
        }

        .app {
          min-height: 100vh;
          background: #f5f7fa;
        }

        .topbar {
          height: 76px;
          background: white;
          border-bottom: 1px solid #e5eaf1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 30px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #eaf5ee;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
        }

        .brand h1 {
          font-size: 19px;
          margin: 0;
          color: #172b4d;
        }

        .brand span {
          color: #8a94a6;
          font-size: 11px;
        }

        .top-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #1d4d72;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .logout-small {
          padding: 8px 12px;
          border: 1px solid #d9e0ea;
          border-radius: 8px;
          background: white;
        }

        .layout {
          display: flex;
          min-height: calc(100vh - 76px);
        }

        .sidebar {
          width: 235px;
          background: #102a43;
          padding: 25px 15px;
          display: flex;
          flex-direction: column;
        }

        .menu-title {
          color: #8ba0b5;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 10px 14px;
        }

        .second {
          margin-top: 18px;
        }

        .menu-item {
          width: 100%;
          border: 0;
          background: transparent;
          color: #d7e2ed;
          padding: 13px 14px;
          border-radius: 9px;
          text-align: left;
          display: flex;
          gap: 12px;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .menu-item:hover,
        .menu-item.selected {
          background: #1d4d72;
          color: white;
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .api-status {
          color: #b9e6cc;
          font-size: 11px;
          padding: 12px;
          background: rgba(255,255,255,0.06);
          border-radius: 8px;
          margin-bottom: 10px;
        }

        .signout-button {
          width: 100%;
          padding: 11px;
          border: 1px solid rgba(255,255,255,0.12);
          background: transparent;
          color: #d7e2ed;
          border-radius: 8px;
        }

        .main-content {
          flex: 1;
          padding: 35px;
          max-width: 1450px;
          margin: 0 auto;
          width: 100%;
        }

        .eyebrow {
          color: #3578b3;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        .error-box {
          background: #fff1f0;
          color: #cf1322;
          padding: 13px;
          border-radius: 9px;
          margin: 15px 0;
        }

        .analysis-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin: 25px 0;
        }

        .analysis-summary > div {
          background: white;
          border: 1px solid #e5eaf1;
          border-radius: 13px;
          padding: 18px;
        }

        .analysis-summary span {
          color: #8a94a6;
          font-size: 11px;
        }

        .analysis-summary strong {
          display: block;
          margin-top: 6px;
          font-size: 22px;
          color: #172b4d;
        }

        .analysis-panel {
          background: white;
          border: 1px solid #e5eaf1;
          border-radius: 17px;
          padding: 25px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .panel-header p {
          color: #8a94a6;
          font-size: 13px;
        }

        .demo-button,
        .clear-button {
          border: 0;
          padding: 9px 13px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 6px;
        }

        .demo-button {
          background: #eaf3fb;
          color: #1d4d72;
        }

        .clear-button {
          background: #f0f2f5;
        }

        .hour-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 13px;
        }

        .hour-input label {
          display: block;
          margin-bottom: 6px;
          color: #667085;
          font-size: 11px;
          font-weight: 600;
        }

        .hour-input input {
          width: 100%;
          padding: 11px;
          border: 1px solid #d9e0ea;
          border-radius: 8px;
          background: #fbfcfe;
        }

        .model-buttons {
          display: flex;
          gap: 12px;
          margin-top: 25px;
        }

        .classification-button,
        .clustering-button {
          border: 0;
          color: white;
          padding: 13px 20px;
          border-radius: 9px;
          font-weight: 700;
        }

        .classification-button {
          background: #3578b3;
        }

        .clustering-button {
          background: #102a43;
        }

        .result-card {
          display: flex;
          gap: 18px;
          background: white;
          border: 1px solid #e5eaf1;
          border-radius: 15px;
          padding: 22px;
          margin-top: 20px;
        }

        .result-icon {
          font-size: 30px;
        }

        .result-content span {
          color: #8a94a6;
          font-size: 10px;
          font-weight: 700;
        }

        .result-content h3 {
          color: #172b4d;
        }

        pre {
          padding: 12px;
          background: #f5f7fa;
          border-radius: 7px;
          font-size: 11px;
          overflow-x: auto;
        }

        .history-list {
          display: grid;
          gap: 12px;
          margin-top: 25px;
        }

        .history-item {
          background: white;
          border: 1px solid #e5eaf1;
          border-radius: 13px;
          padding: 17px;
          display: fle
          align-ite
          align-items: center;
    gap: 15px;
  }

  .history-main {
    flex: 1;
  }

  .history-main strong,
  .history-main span {
    display: block;
  }

  .history-main span {
    margin-top: 4px;
    color: #8a94a6;
    font-size: 11px;
  }

  .history-result {
    color: #3578b3;
    font-size: 13px;
    font-weight: 700;
  }

  .help-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    margin-top: 25px;
  }

  .help-card {
    background: white;
    border: 1px solid #e5eaf1;
    border-radius: 15px;
    padding: 22px;
  }

  .help-card > div {
    font-size: 28px;
  }

  .help-card h3 {
    color: #172b4d;
  }

  .help-card p {
    color: #667085;
    line-height: 1.5;
    font-size: 13px;
  }

  .settings-card {
    background: white;
    border: 1px solid #e5eaf1;
    border-radius: 15px;
    padding: 23px;
    margin-top: 18px;
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .profile-avatar {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: #1d4d72;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 700;
  }

  .setting-icon {
    font-size: 28px;
  }

  .setting-label {
    color: #8a94a6;
    font-size: 10px;
    font-weight: 700;
  }

  .danger-button {
    border: 0;
    background: #cf1322;
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
  }

  .empty-card {
    background: white;
    padding: 50px;
    text-align: center;
    border-radius: 15px;
    margin-top: 25px;
  }

  .empty-card button {
    border: 0;
    background: #1d4d72;
    color: white;
    padding: 11px 18px;
    border-radius: 8px;
  }

  .footer {
    padding: 20px;
    text-align: center;
    color: #8a94a6;
    font-size: 11px;
    background: white;
  }

  .footer span {
    margin: 0 6px;
  }

  @media (max-width: 1000px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .application-grid,
    .help-grid {
      grid-template-columns: 1fr;
    }

    .hour-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 700px) {
    .topbar {
      padding: 0 15px;
    }

    .top-user > span,
    .logout-small {
      display: none;
    }

    .sidebar {
      width: 70px;
    }

    .menu-item {
      justify-content: center;
    }

    .menu-item span,
    .menu-title,
    .sidebar-bottom {
      display: none;
    }

    .main-content {
      padding: 20px 15px;
    }

    .stats-grid,
    .analysis-summary {
      grid-template-columns: 1fr;
    }

    .hour-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .model-buttons {
      flex-direction: column;
    }
  }
`}</style>
    </div>
  );
}

function ResultCard({ title, icon, result }) {
  return (
    <div className="result-card">
      <div className="result-icon">
        {icon}
      </div>

      <div className="result-content">
        <span>{title}</span>

        <h3>
          {result.prediction ??
            result.predicted_category ??
            result.category ??
            result.cluster ??
            result.cluster_label ??
            result.result ??
            "Result received"}
        </h3>

        <pre>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div>
      <span className="eyebrow">
        AQI AIR QUALITY PLATFORM
      </span>

      <h2
        style={{
          margin: "8px 0",
          color: "#172b4d",
          fontSize: "31px",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: 0,
          color: "#667085",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

export default App;
          
                
