import { useState } from "react";
import "./App.css";

function App() {
  const hours = Array.from({ length: 24 }, (_, i) =>
    `hour_${String(i).padStart(2, "0")}`
  );

  const [values, setValues] = useState(
    Object.fromEntries(hours.map((hour) => [hour, ""]))
  );

  const [prediction, setPrediction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (hour, value) => {
    setValues({ ...values, [hour]: value });
  };

  const handlePredict = async () => {
    setLoading(true);
    setPrediction("");
    setError("");

    try {
      const data = Object.fromEntries(
        hours.map((hour) => [hour, Number(values[hour]) || 0])
      );

      const response = await fetch(
        "https://ml-fastapi-1-gsn3.onrender.com/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      setPrediction(result.prediction);
    } catch (err) {
      setError("Unable to connect to the Classification API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>🌍 AQI Air Quality Prediction</h1>
          <p>Machine Learning Web Application</p>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <h2>Air Quality Classification</h2>
          <p>
            Enter the 24 hourly AQI values to predict the air quality
            category using our Machine Learning Classification model.
          </p>
        </section>

        <section className="card">
          <h2>Hourly AQI Input</h2>
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

          <button onClick={handlePredict} disabled={loading}>
            {loading ? "Predicting..." : "Predict AQI"}
          </button>

          {prediction && (
            <div className="result">
              <span>Prediction</span>
              <strong>{prediction}</strong>
            </div>
          )}

          {error && <div className="error">{error}</div>}
        </section>

        <section className="info">
          <div>
            <h3>📊 Machine Learning</h3>
            <p>Random Forest Classification</p>
          </div>

          <div>
            <h3>⏱️ Input Features</h3>
            <p>24 hourly AQI observations</p>
          </div>

          <div>
            <h3>🚀 Deployment</h3>
            <p>FastAPI + Render</p>
          </div>
        </section>
      </main>

      <footer>
        <p>AQI ML Project • Classification System</p>
      </footer>
    </div>
  );
}

export default App;