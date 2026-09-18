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
          : "https://ml-fastapi-s2v5.onrender.com/cluster";

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
          <h2>Air Quality Analysis</h2>
          <p>
            Use hourly AQI observations to perform air quality
            classification and clustering using Machine Learning.
          </p>
        </section>

        <div className="tabs">
          <button
            className={mode === "classification" ? "tab active" : "tab"}
            onClick={() => switchMode("classification")}
          >
            🌿 Classification
          </button>

          <button
            className={mode === "clustering" ? "tab active" : "tab"}
            onClick={() => switchMode("clustering")}
          >
            📊 Clustering
          </button>
        </div>

        <section className="card">

          <h2>
            {mode === "classification"
              ? "AQI Air Quality Classification"
              : "AQI Clustering"}
          </h2>

          <p className="help">
            Enter AQI values from hour_00 to hour_23.
          </p>

          <div className="grid">
            {hours.map((hour) => (
              <div className="input-group" key={hour}>
                <label>{hour}</label>

                <input
                  type="number"
                  min="0"
                  value={values[hour]}
                  onChange={(e) =>
                    handleChange(hour, e.target.value)
                  }
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
              ? "Predict AQI Category"
              : "Find AQI Cluster"}
          </button>

          {result && (
            <div className="result">
              <span>
                {mode === "classification"
                  ? "AQI Classification"
                  : "AQI Cluster"}
              </span>

              <strong>{result}</strong>
            </div>
          )}

          {error && (
            <div className="error">
              {error}
            </div>
          )}

        </section>

        <section className="info">

          <div>
            <h3>🌿 Classification</h3>
            <p>Random Forest Classification</p>
          </div>

          <div>
            <h3>📊 Clustering</h3>
            <p>K-Means Clustering • 2 Clusters</p>
          </div>

          <div>
            <h3>⏱️ Input Features</h3>
            <p>24 hourly AQI observations</p>
          </div>

        </section>

      </main>

      <footer>
        <p>AQI ML Project • Classification & Clustering</p>
      </footer>
    </div>
  );
}

export default App;