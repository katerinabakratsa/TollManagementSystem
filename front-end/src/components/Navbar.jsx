import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav>
            <ul>
                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/map">Χάρτης</Link></li>
                <li><Link to="/payments">Οφειλές</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;
