// src/pages/LoginForm.tsx
import React, { useState, useContext } from "react";
import axios from "../api/api";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useContext(AppContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password) {
      setError("Please enter both username and password.");
      setLoading(false);
      return;
    }

    try {
      // Send data as multipart/form-data
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post("/login", formData, {
        withCredentials: true, // Ensure cookies, if any, are included
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "OK" && response.data.token) {
        login(response.data.token);
        navigate("/dashboard"); // Redirect to Dashboard
      } else {
        setError(response.data.info || "Login failed.");
      }
    } catch (error: any) {
      if (error.response) {
        setError(
          `Error ${error.response.status}: ${JSON.stringify(
            error.response.data
          )}`
        );
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="mt-4">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="mb-3">
          <label className="form-label">
            Username:
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required // Form validation
            />
          </label>
        </div>
        <div className="mb-3">
          <label className="form-label">
            Password:
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required // Form validation
            />
          </label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Logging in..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
