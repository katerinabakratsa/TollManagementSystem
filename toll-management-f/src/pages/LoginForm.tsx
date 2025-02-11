import React, { useState, useContext } from "react";
import axios from "../api/api";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null); // ✅ ΔΕΝ εξαφανίζεται αυτόματα
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useContext(AppContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !password) {
      setError("❌ Please enter both username and password.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post("/login", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "OK" && response.data.token) {
        login(response.data.token);
        // ✅ Αποθηκεύουμε το OpID του χρήστη στο localStorage
        localStorage.setItem("OpID", response.data.OpID); // "null" για admin, αλλιώς user ID
        setError(null); // ✅ Αφαιρούμε το error ΜΟΝΟ αν γίνει επιτυχές login
        navigate("/");
      } else {
        setError("❌ Incorrect username or password."); // ✅ Δεν καθαρίζεται
      }
    } catch (error: any) {
      setError("❌ Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>

        {/* ✅ Το μήνυμα λάθους ΔΕΝ εξαφανίζεται */}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
