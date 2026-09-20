import { useState } from "react";

const CLASSIFICATION_API =
  "https://aqi-classification.onrender.com/predict";

const CLUSTERING_API =
  "https://ml-fastapi-s2v5.onrender.com/cluster";

function App() {
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

  const updateValue = (index, value) => {
    const updated = [...hourlyValues];
    updated[index] = value;
    setHourlyValues(updated);
  };

  const clearAll = () => {
    setHourlyValues(Array(24).fill(""));
    setClassificationResult(null);
    setClusteringResult(null);
    setError("");
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

  const classifyAQI = async () => {
    setError("");
    setClassificationResult(null);

    if (!validateValues()) {
      return;
    }

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
    } catch (err) {
      setError(
        "Unable to connect to the Classification API. Please check that the API is running."
      );
      console.error(err);
    } finally {
      setLoadingClassification(false);
    }
  };

  const clusterAQI = async () => {
    setError("");
    setClusteringResult(null);

    if (!validateValues()) {
      return;
    }

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
    } catch (err) {
      setError(
        "Unable to connect to the Clustering API. Please check that the API is running."
      );
      console.error(err);
    } finally {
      setLoadingClustering(false);
    }
  };

  const averageAQI =
    hourlyValues.every((value) => value !== "")
      ? (
          getValues().reduce((sum, value) => sum + value, 0) / 24
        ).toFixed(2)
      : "--";

  const getAQIStatus = (value) => {
    if (value === "--") return "Waiting for input";
    if (value <= 50) return "Good";
    if (value <= 100) return "Satisfactory";
    if (value <= 200) return "Moderate";
    if (value <= 300) return "Poor";
    if (value <= 400) return "Very Poor";
    return "Severe";
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>🌿 AQI Air Quality Platform</h1>
          <p>AI-powered Air Quality Analysis</p>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          ML Platform
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <p className="eyebrow">AIR QUALITY INTELLIGENCE</p>
            <h2>24-Hour AQI Analysis</h2>
            <p>
              Enter 24 hourly AQI observations to classify and
              cluster the air-quality pattern using trained machine
              learning models.
            </p>
          </div>

          <div className="hero-card">
            <span>Average AQI</span>
            <strong>{averageAQI}</strong>
            <small>{getAQIStatus(averageAQI)}</small>
          </div>
        </section>

        {error && (
          <div className="error-box">
            ⚠️ {error}
          </div>
        )}

        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Hourly AQI Input</h3>
              <p>Enter AQI values from Hour 1 to Hour 24.</p>
            </div>

            <button
              className="secondary-button"
              onClick={clearAll}
            >
              Clear
            </button>
          </div>

          <div className="hour-grid">
            {hourlyValues.map((value, index) => (
              <div className="hour-input" key={index}>
                <label>Hour {index + 1}</label>

                <input
                  type="number"
                  min="0"
                  value={value}
                  placeholder="AQI"
                  onChange={(e) =>
                    updateValue(index, e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <div className="button-row">
            <button
              className="primary-button"
              onClick={classifyAQI}
              disabled={loadingClassification}
            >
              {loadingClassification
                ? "Classifying..."
                : "AQI Classification"}
            </button>

            <button
              className="cluster-button"
              onClick={clusterAQI}
              disabled={loadingClustering}
            >
              {loadingClustering
                ? "Clustering..."
                : "AQI Clustering"}
            </button>
          </div>
        </section>

        {classificationResult && (
          <section className="result-card classification">
            <div className="result-icon">📊</div>

            <div className="result-content">
              <span className="result-label">
                CLASSIFICATION RESULT
              </span>

              <h3>
                {classificationResult.prediction ??
                  classificationResult.predicted_category ??
                  classificationResult.category ??
                  classificationResult.result ??
                  "Prediction received"}
              </h3>

              <pre>
                {JSON.stringify(
                  classificationResult,
                  null,
                  2
                )}
              </pre>
            </div>
          </section>
        )}

        {clusteringResult && (
          <section className="result-card clustering">
            <div className="result-icon">🔵</div>

            <div className="result-content">
              <span className="result-label">
                CLUSTERING RESULT
              </span>

              <h3>
                {clusteringResult.cluster ??
                  clusteringResult.cluster_label ??
                  clusteringResult.prediction ??
                  clusteringResult.result ??
                  "Cluster received"}
              </h3>

              <pre>
                {JSON.stringify(
                  clusteringResult,
                  null,
                  2
                )}
              </pre>
            </div>
          </section>
        )}

        <section className="info-grid">
          <div className="info-card">
            <span className="info-icon">🤖</span>
            <h3>Classification</h3>
            <p>
              Predicts the AQI category using the trained
              classification model.
            </p>
          </div>

          <div className="info-card">
            <span className="info-icon">🔬</span>
            <h3>Clustering</h3>
            <p>
              Groups the submitted AQI pattern according to the
              trained clustering model.
            </p>
          </div>

          <div className="info-card">
            <span className="info-icon">⏱️</span>
            <h3>24-Hour Analysis</h3>
            <p>
              Uses 24 hourly AQI observations as model input for
              analysis.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <p>
          AQI Air Quality ML Platform • Classification • Clustering
        </p>
      </footer>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #f4f7fb;
          color: #172033;
        }

        button,
        input {
          font-family: inherit;
        }

        .app {
          min-height: 100vh;
          background: linear-gradient(
            180deg,
            #f4f8ff 0%,
            #ffffff 55%,
            #f5f8fc 100%
          );
        }

        .topbar {
          min-height: 86px;
          padding: 18px 6%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border-bottom: 1px solid #e5eaf1;
        }

        .topbar h1 {
          margin: 0;
          font-size: 24px;
          color: #172b4d;
        }

        .topbar p {
          margin: 5px 0 0;
          color: #718096;
          font-size: 13px;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 20px;
          background: #eefbf3;
          color: #18794e;
          font-size: 13px;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22a06b;
        }

        .container {
          width: 88%;
          max-width: 1250px;
          margin: 0 auto;
          padding: 38px 0 50px;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 25px;
          margin-bottom: 28px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #356ae6;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        .hero h2 {
          margin: 0;
          font-size: 38px;
          color: #172b4d;
        }

        .hero p:not(.eyebrow) {
          max-width: 680px;
          line-height: 1.6;
          color: #667085;
        }

        .hero-card {
          min-width: 190px;
          padding: 22px;
          border-radius: 18px;
          background: #172b4d;
          color: white;
          box-shadow: 0 12px 30px rgba(23, 43, 77, 0.15);
        }

        .hero-card span,
        .hero-card small {
          display: block;
          opacity: 0.75;
        }

        .hero-card strong {
          display: block;
          margin: 6px 0;
          font-size: 34px;
        }

        .error-box {
          margin-bottom: 20px;
          padding: 14px 18px;
          border-radius: 12px;
          background: #fff1f0;
          border: 1px solid #ffccc7;
          color: #cf1322;
        }

        .panel {
          padding: 28px;
          background: white;
          border: 1px solid #e5eaf1;
          border-radius: 20px;
          box-shadow: 0 8px 25px rgba(31, 41, 55, 0.06);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 21px;
        }

        .panel-header p {
          margin: 5px 0 0;
          color: #718096;
          font-size: 14px;
        }

        .hour-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 15px;
        }

        .hour-input label {
          display: block;
          margin-bottom: 6px;
          color: #667085;
          font-size: 12px;
          font-weight: 600;
        }

        .hour-input input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d9e0ea;
          border-radius: 9px;
          outline: none;
          font-size: 14px;
          background: #fbfcfe;
        }

        .hour-input input:focus {
          border-color: #356ae6;
          background: white;
        }

        .button-row {
          display: flex;
          gap: 14px;
          margin-top: 28px;
        }

        .primary-button,
        .cluster-button,
        .secondary-button {
          border: 0;
          border-radius: 10px;
          padding: 13px 22px;
          cursor: pointer;
          font-weight: 700;
          transition: 0.2s;
        }

        .primary-button {
          background: #356ae6;
          color: white;
        }

        .cluster-button {
          background: #172b4d;
          color: white;
        }

        .secondary-button {
          background: #edf1f7;
          color: #344054;
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
          opacity: 0.92;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .result-card {
          display: flex;
          gap: 20px;
          margin-top: 24px;
          padding: 24px;
          background: white;
          border-radius: 18px;
          border: 1px solid #e5eaf1;
          box-shadow: 0 8px 25px rgba(31, 41, 55, 0.06);
        }

        .classification {
          border-left: 5px solid #356ae6;
        }

        .clustering {
          border-left: 5px solid #172b4d;
        }

        .result-icon {
          font-size: 35px;
        }

        .result-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #718096;
        }

        .result-content h3 {
          margin: 7px 0 12px;
          font-size: 25px;
          color: #172b4d;
        }

        pre {
          max-width: 100%;
          overflow-x: auto;
          padding: 12px;
          border-radius: 8px;
          background: #f6f8fb;
          font-size: 12px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 28px;
        }

        .info-card {
          padding: 24px;
          background: white;
          border: 1px solid #e5eaf1;
          border-radius: 16px;
        }

        .info-icon {
          font-size: 28px;
        }

        .info-card h3 {
          margin: 12px 0 7px;
        }

        .info-card p {
          margin: 0;
          color: #718096;
          line-height: 1.5;
          font-size: 14px;
        }

        footer {
          padding: 25px;
          text-align: center;
          color: #8a94a6;
          font-size: 13px;
        }

        @media (max-width: 900px) {
          .hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .hero-card {
            width: 100%;
          }

          .hour-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .topbar {
            padding: 15px 5%;
          }

          .topbar h1 {
            font-size: 18px;
          }

          .status {
            display: none;
          }

          .container {
            width: 92%;
            padding-top: 25px;
          }

          .hero h2 {
            font-size: 30px;
          }

          .panel {
            padding: 18px;
          }

          .hour-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .button-row {
            flex-direction: column;
          }

          .primary-button,
          .cluster-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default App;