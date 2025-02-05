import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Map from "./pages/Map";
import Payments from "./pages/Payments";
import DebtView from "./pages/DebtView";
import DataAnalysis from "./pages/DataAnalysis";
import Notifications from "./pages/Notifications";
import History from "./pages/History";
import Navbar from "./components/Navbar"; // Το Navbar για την πλοήγηση

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
            <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/map" element={<Map />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/debts" element={<DebtView />} />
                <Route path="/dataanalysis" element={<DataAnalysis />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/history" element={<History />} />
            </Routes>
        </Router>
    );
}

export default App;
