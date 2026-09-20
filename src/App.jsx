import { useMemo, useState } from "react";
import "./App.css";

const HOURS = Array.from({ length: 24 }, (_, index) => index);

const CLASSIFICATION_API =
  "https://ml-fastapi-1-gsn3.onrender.com/predict";

const CLUSTERING_API =
  "https://aqi-clustering-api.onrender.com/cluster";

const createEmptyValues = () =>
  Array.from({ length: 24 }, () => "");

function getAQILevel(value) {
  if (value > 300) return "Very Poor";
  if (value > 200) return "Poor";
  if (value > 100) return "Moderate";
  if (value > 50) return "Satisfactory";
  return "Good";
}

function App() {
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("aqi_logged_in") === "true"
  );

  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState(
    localStorage.getItem("aqi_username") || ""
  );
  const [password, setPassword] = useState("");

  const [page, setPage] = useState("home");

  const [aqiValues, setAqiValues] = useState(
    createEmptyValues()
  );

  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("aqi_history") || "[]"
      );
    } catch {
      return [];
    }
  });

  const numericValues = useMemo(() => {
    return aqiValues.map((value) => Number(value) || 0);
  }, [aqiValues]);

  const averageAQI =
    numericValues.reduce((total, value) => total + value, 0) /
    24;

  const maximumAQI = Math.max(...numericValues);
  const minimumAQI = Math.min(...numericValues);

  const currentUser =
    username ||
    localStorage.getItem("aqi_username") ||
    "AQI User";

  function handleLogin(event) {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    localStorage.setItem("aqi_logged_in", "true");
    localStorage.setItem(
      "aqi_username",
      username.trim()
    );

    setLoggedIn(true);
    setPassword("");
  }

  function handleLogout() {
    localStorage.removeItem("aqi_logged_in");
    setLoggedIn(false);
    setPage("home");
    setResult("");
    setError("");
  }

  function updateAQI(index, value) {
    setAqiValues((previous) => {
      const updated = [...previous];
      updated[index] = value;
      return updated;
    });
  }

  function clearValues() {
    setAqiValues(createEmptyValues());
    setResult("");
    setError("");
  }

  function navigate(target) {
    setPage(target);
    setResult("");
    setError("");
  }

  function addHistory(type, output) {
    const record = {
      id: Date.now(),
      type,
      result: output,
      average: Number(averageAQI.toFixed(2)),
      time: new Date().toLocaleString(),
    };

    setHistory((previous) => {
      const updated = [record, ...previous].slice(0, 20);
      localStorage.setItem(
        "aqi_history",
        JSON.stringify(updated)
      );
      return updated;
    });
  }

  async function runModel(type) {
    setLoading(true);
    setResult("");
    setError("");

    try {
      const payload = {};

      HOURS.forEach((hour) => {
        const key = `hour_${String(hour).padStart(2, "0")}`;
        payload[key] = Number(aqiValues[hour]) || 0;
      });

      const api =
        type === "classification"
          ? CLASSIFICATION_API
          : CLUSTERING_API;

      const response = await fetch(api, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      let output;

      if (type === "classification") {
        output =
          data.prediction ??
          data.classification ??
          "No classification returned";
      } else