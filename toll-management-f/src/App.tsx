// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginForm from "./pages/LoginForm";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import UsersDashboard from "./pages/UsersDashboard";
import MapPage from "./pages/MapPage";
import DebtsOverview from "./pages/DebtsOverview";
import Crossings from "./pages/Crossings";
import History from "./pages/History";
import PrivateRoute from "./components/PrivateRoute";
import NavbarComponent from "./components/NavbarComponent"; // Optional: Create a Navbar

import Userscrossings from "./pages/Userscrossings";   // π.χ. User

const App: React.FC = () => {
  return (
    <Router>
      <NavbarComponent /> {/* Optional: Add a navigation bar */}
      <Routes>
        {/* Public Route for Login */}
        <Route path="/login" element={<LoginForm />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/user/dashboard" element={<UsersDashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/debts" element={<DebtsOverview />} />
          <Route path="/history" element={<History />} />
          <Route path="/crossings" element={<Crossings />} />
          <Route path="/admin/crossings" element={<Crossings />} />
          <Route path="/user/crossings" element={<Userscrossings />} />
        </Route>

        {/* Redirect to Home if authenticated, else to Login */}
        <Route path="/" element={<Navigate to="/" replace />} />

        {/* Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
