import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaRoad, FaMoneyBill, FaChartBar, FaHistory, FaBell, FaMap, FaGlobe } from "react-icons/fa";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import api from "../api/api"; // Για το API

// 🎯 Ορισμός interface για τα Διόδια
interface TollStation {
    TollID: string;
    Name: string;
    Latitude: number;
    Longitude: number;
}

// 🎯 Default marker icon
const DefaultIcon = L.icon({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [20, 30],
    iconAnchor: [10, 30],
});
L.Marker.prototype.options.icon = DefaultIcon;

const Home: React.FC = () => {
    const [tollStations, setTollStations] = useState<TollStation[]>([]);

        // 🎯 Διαβάζουμε το OpID από το localStorage
        const storedOpID = localStorage.getItem("OpID");
        const isAdmin = storedOpID === "null"; // Admin αν το OpID είναι "null"
    

    // 🎯 Φέρνουμε τα διόδια από το backend
    useEffect(() => {
        const fetchTollStations = async () => {
            try {
                const response = await api.get("/admin/tollstations");
                setTollStations(response.data);
            } catch (error) {
                console.error("Error fetching toll stations:", error);
            }
        };
        fetchTollStations();
    }, []);

      // 🛠 Δυναμική αλλαγή του path για τις Διελεύσεις
      const crossingsPath = isAdmin ? "/admin/crossings" : "/user/crossings";
      const dashboardPath = isAdmin ? "/admin/dashboard" : "/user/dashboard";

    const menuItems = [
        { title: "Διελεύσεις", description: "Σελίδα με τα δεδομένα διελεύσεων.", icon: <FaRoad />, path: crossingsPath },
        { title: "Προβολή Οφειλών", description: "Σελίδα με τις οικονομικές συναλλαγές και τα χρέη/οφειλές.", icon: <FaMoneyBill />, path: "/debts" },
        { title: "Ανάλυση Δεδομένων", description: "Ενότητα με γραφήματα και στατιστικά δεδομένα.", icon: <FaChartBar />, path: dashboardPath },
        { title: "Ιστορικό", description: "Πρόσβαση σε παλαιότερες εγγραφές διελεύσεων και συναλλαγών.", icon: <FaHistory />, path: "/history" },
     ];

    return (
        <Container className="mt-5 text-center">
            <h1 className="mb-4">Home Page</h1>
            <Row className="g-4">
                {menuItems.map((item, index) => (
                    <Col key={index} md={6}>
                        <Link to={item.path} style={{ textDecoration: "none", color: "inherit" }}>
                            <Card className="menu-card">
                                <Card.Body>
                                    <div className="menu-icon">{item.icon}</div>
                                    <Card.Title>{item.title}</Card.Title>
                                    <Card.Text>{item.description}</Card.Text>
                                </Card.Body>
                            </Card>
                        </Link>
                    </Col>
                ))}
            </Row>

            {/* 🔥 Διαδραστικός Μικρός Χάρτης με Markers */}
            <div className="map-wrapper">
                <MapContainer center={[37.9838, 23.7275]} zoom={10} scrollWheelZoom={true} className="map-container">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {tollStations.map((station) => (
                        <Marker key={station.TollID} position={[station.Latitude, station.Longitude]} />
                    ))}
                </MapContainer>
            </div>

            {/* 🔘 Κουμπί "Πλήρης Χάρτης" - Στο κέντρο κάτω από τον χάρτη */}
            <div className="map-button-container">
                <Link to="/map">
                    <Button className="map-button">
                        <FaGlobe /> Πλήρης Χάρτης
                    </Button>
                </Link>
            </div>
        </Container>
    );
};

export default Home;
