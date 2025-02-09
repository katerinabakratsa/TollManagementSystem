import React, { useEffect, useState } from "react";
import { Container, Table, Form, Button } from "react-bootstrap";
import api from "../api/api";

interface Crossing {
    stationName: string;
    passDate: string;
    location: string;
    provider: string;
    cost: number;
}

const Crossings: React.FC = () => {
    const [crossings, setCrossings] = useState<Crossing[]>([]);
    const [operators, setOperators] = useState<string[]>([]);
    const [selectedOperator, setSelectedOperator] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("20220101");
    const [endDate, setEndDate] = useState<string>("20221231");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [tollStations, setTollStations] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const fetchTollStations = async () => {
            try {
                const token = localStorage.getItem("authToken");
                if (!token) {
                    console.error("No authentication token found.");
                    return;
                }

                const headers = { headers: { "X-OBSERVATORY-AUTH": token } };
                const response = await api.get("/admin/tollstations", headers);

                // Δημιουργία map για εύκολη πρόσβαση στις πληροφορίες
                const stationsMap = response.data.reduce((acc: any, station: any) => {
                    acc[station.TollID] = {
                        locality: station.Locality || "N/A",
                        operator: station.OpID || "N/A",
                    };
                    return acc;
                }, {});

                console.log(" Toll Stations Map:", stationsMap);
                setTollStations(stationsMap);
            } catch (error) {
                console.error("Error fetching toll stations:", error);
            }
        };

        const fetchOperators = async () => {
            try {
                const token = localStorage.getItem("authToken");
                if (!token) {
                    console.error("No authentication token found.");
                    return;
                }

                const headers = { headers: { "X-OBSERVATORY-AUTH": token } };
                const response = await api.get("/admin/tollstations", headers);
                const uniqueOperators = Array.from(new Set(response.data.map((op: any) => op.OpID)));

                setOperators(uniqueOperators);
                setSelectedOperator(uniqueOperators[0] || "");
            } catch (error) {
                console.error("Error fetching operators:", error);
            }
        };

        // ✅ Κλήση και των δύο συναρτήσεων μέσα στο useEffect
        fetchTollStations();
        fetchOperators();
    }, []); // Το dependency array είναι σωστό (άδεια λίστα)

    const fetchCrossings = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("authToken");
            if (!token) {
                setError("No authentication token found.");
                return;
            }

            const headers = { headers: { "X-OBSERVATORY-AUTH": token } };

            console.log("Fetching crossings for:", selectedOperator, startDate, endDate);

            // ✅ Διόρθωση formatDate για να ελέγχει αν το date είναι τύπου Date
            const formatDate = (date: string) => {
                if (!date || date.length !== 8) {
                    return "20220101"; // Αν δεν έχει σωστό format, επέστρεψε default
                }
                return date; // Ημερομηνία είναι ήδη σωστά φορμαρισμένη
            };


            const formattedStart = formatDate(startDate);
            const formattedEnd = formatDate(endDate);

            console.log("📌 Formatted Start Date:", formattedStart);
            console.log("📌 Formatted End Date:", formattedEnd);

            const response = await api.get(
                `/passAnalysis/stationOpID/${selectedOperator}/tagOpID/${selectedOperator}/date_from/${formattedStart}/date_to/${formattedEnd}`,
                headers
            );

            console.log("📌 API Response:", response.data);

            if (response.data.length > 0) {
                console.log("✅ Found Passes:", response.data[0].passList);
                setCrossings(response.data[0].passList || []);
            } else {
                console.log("❌ No Passes Found.");
                setCrossings([]);
            }

        } catch (err: any) {
            setError("Failed to fetch data.");
            console.error("API error:", err);
        } finally {
            setLoading(false);
        }
    };



    return (
        <Container className="mt-5">
            <h1 className="text-center">Toll Crossings</h1>

            {/* Επιλογή εταιρείας */}
            <Form.Group controlId="operatorSelect" className="mb-3">
                <Form.Label>Επιλογή Εταιρείας Διοδίων</Form.Label>
                <Form.Select value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)}>
                    {operators.map((op) => (
                        <option key={op} value={op}>{op}</option>
                    ))}
                </Form.Select>
            </Form.Group>

            {/* Κουμπί εφαρμογής φίλτρων */}
            <Button onClick={fetchCrossings} variant="primary" className="mb-3">
                Εφαρμογή Φίλτρων
            </Button>

            {/* Πίνακας Διελεύσεων */}
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Όνομα Σταθμού</th>
                        <th>Ημερομηνία</th>
                        <th>Τοποθεσία</th>
                        <th>Πάροχος</th>
                        <th>Κόστος</th>
                    </tr>
                </thead>
                <tbody>
                    {crossings.map((crossing, index) => {
                        console.log("🔹 Crossing Data:", crossing);
                        return (
                            <tr key={index}>
                                <td>{crossing.stationID || "N/A"}</td>
                                <td>{crossing.timestamp || "N/A"}</td>
                                <td>{tollStations[crossing.stationID]?.locality || "N/A"}</td>
                                <td>{tollStations[crossing.stationID]?.operator || "N/A"}</td>
                                <td>{(crossing.passCharge ?? 0).toFixed(2)} €</td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </Container>
    );
};

export default Crossings;
