import { useState } from "react";
import "./App.css";

const hours = Array.from({ length: 24 }, (_, i) =>
  `hour_${String(i).padStart(2, "0")}`
);

function App() {
  const [mode, setMode] = useState("classification");

  const [values, setValues] = useState(
    Object.fromEntries(hours.map((hour) => [hour, ""]))
  );

  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (hour, value) => {
    setValues({ ...values, [hour]: value });
  };

  const handlePredict = async () => {
    setLoading(true);
    setResult("");
    setError("");

    try {
      const data = Object.fromEntries(
        hours.map((hour) => [hour, Number(values[hour]) || 0])
      );

      const apiUrl =
        mode === "classification"
          ? "https://ml-fastapi-1-gsn3.onrender.com/predict"
          : "https://aqi-clustering-api.onrender.com/cluster";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const dataResult = await response.json();

      if (mode === "classification") {
        setResult(dataResult.prediction);
      } else {
        setResult(`Cluster ${dataResult.cluster}`);
      }
    } catch (err) {
      setError(
        mode === "classification"
          ? "Unable to connect to the Classification API."
          : "Unable to connect to the Clustering API."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setResult("");
    setError("");
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>🌍 AQI Air Quality ML Application</h1>
          <p>Machine Learning Web Application</p>
        </div>
      </header>

      <main className="container">

        <section className="hero">
          <div className="hero-badge">AIR QUALITY INTELLIGENCE</div>
          <h2>Air Quality Analysis</h2>
          <p>
            Analyze hourly Air Quality Index observations using
            Machine Learning classification and clustering models.
          </p>
        </section>

        <section className="dashboard-cards">
          <div className="dashboard-card">
            <span className="dashboard-icon">🌿</span>
            <div>
              <strong>AQI Classification</strong>
              <small>Air quality category prediction</small>
            </div>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-icon">📊</span>
            <div>
              <strong>AQI Clustering</strong>
              <small>Air quality pattern grouping</small>
            </div>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-icon">⏱️</span>
            <div>
              <strong>24 Hour Analysis</strong>
              <small>Hourly AQI observations</small>
            </div>
          </div>
        </section>

        <div className="tabs">
          <button
            className={mode === "classification" ? "active" : ""}
            onClick={() => {
              setMode("classification");
              setResult("");
              setError("");
            }}
          >
            🌿 Classification
          </button>

          <button
            className={mode === "clustering" ? "active" : ""}
            onClick={() => {
              setMode("clustering");
              setResult("");
              setError("");
            }}
          >
            📊 Clustering
          </button>
        </div>

        <section className="card prediction-card">
          <div className="section-heading">
            <div>
              <span className="section-label">MACHINE LEARNING</span>
              <h2>
                {mode === "classification"
                  ? "AQI Air Quality Classification"
                  : "AQI Air Quality Clustering"}
              </h2>
              <p>
                Enter AQI values from <strong>hour_00</strong> to{" "}
                <strong>hour_23</strong>.
              </p>
            </div>
          </div>

          <div className="input-grid">
            {hours.map((hour) => (
              <div className="input-group" key={hour}>
                <label>{hour}</label>
                <input
                  type="number"
                  value={values[hour]}
                  onChange={(e) => handleChange(hour, e.target.value)}
                  placeholder="AQI"
                />
              </div>
            ))}
          </div>

          <button
            className="predict-button"
            onClick={handlePredict}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : mode === "classification"
              ? "Predict AQI Classification"
              : "Predict AQI Cluster"}
          </button>

          {result && (
            <div className="result">
              <h3>
                {mode === "classification"
                  ? "AQI Classification Result"
                  : "AQI Clustering Result"}
              </h3>
              <p>{result}</p>
            </div>
          )}

          {error && <div className="error">{error}</div>}
        </section>

        <section className="info">
          <h3>About this AQI Model</h3>
          <p>
            This application uses hourly AQI observations to identify
            air-quality categories and discover similar air-quality
            patterns using Machine Learning.
          </p>
        </section>

        <footer className="help">
          <strong>AQI Air Quality ML Application</strong>
          <span>Classification &amp; Clustering • Machine Learning Project</span>
        </footer>

      </main>
    </div>
  );
}
