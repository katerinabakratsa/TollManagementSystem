import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Map from "./pages/Map";
import Payments from "./pages/Payments";
import Navbar from "./components/Navbar";

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/map" element={<Map />} />
                <Route path="/payments" element={<Payments />} />
            </Routes>
        </Router>
    );
}

export default App;
