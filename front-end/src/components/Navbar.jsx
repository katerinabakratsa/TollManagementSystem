import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav>
            <ul>
            <li><Link to="/">Αρχική</Link></li>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/map">Χάρτης</Link></li>
                <li><Link to="/payments">Πληρωμές</Link></li>
                <li><Link to="/debts">Οφειλές</Link></li>
                <li><Link to="/dataanalysis">Ανάλυση Δεδομένων</Link></li>
                <li><Link to="/notifications">Ειδοποιήσεις</Link></li>
                <li><Link to="/history">Ιστορικό</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;
