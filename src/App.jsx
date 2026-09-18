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
    setValues({
      ...values,
      [hour]: value,
    });
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
      <div className="container">
        <h1>AQI Classification</h1>

        <p className="subtitle">
          Enter hourly AQI values to predict the AQI category.
        </p>

        <div className="grid">
          {hours.map((hour) => (
            <div className="input-group" key={hour}>
              <label>{hour}</label>
              <input
                type="number"
                min="0"
                value={values[hour]}
                onChange={(e) => handleChange(hour, e.target.value)}
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
            <h2>Prediction</h2>
            <p>{prediction}</p>
          </div>
        )}

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

export default App;