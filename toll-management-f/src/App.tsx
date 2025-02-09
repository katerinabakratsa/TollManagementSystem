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
import MapPage from "./pages/MapPage";
import DebtsOverview from "./pages/DebtsOverview";
import DebtsDetail from "./pages/DebtsDetails";
import Crossings from "./pages/Crossings";

import DebtsOverviewTroubleshoot from "./pages/DebtsOverviewTroubleshoot";
import DebtsOverviewSingleDate from "./pages/DebtsOverviewSingleDate";

import PrivateRoute from "./components/PrivateRoute";
import NavbarComponent from "./components/NavbarComponent"; // Optional: Create a Navbar

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/debts" element={<DebtsOverview />} />
          <Route path="/debts/:data" element={<DebtsDetail />} />
          <Route path="/crossings" element={<Crossings />} />
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
