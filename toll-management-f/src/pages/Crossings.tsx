// src/pages/Crossings.tsx

import React, { useEffect, useState } from "react";
import { Container, Table, Form, Button } from "react-bootstrap";
import api from "../api/api";

interface Crossing {
  stationID: string;
  timestamp: string;
  locality: string;
  provider: string;
  passCharge: number;
}
interface TollStation {
  TollID: string;
  Locality: string;
  OpID: string;
}


const Crossings: React.FC = () => {
  const [crossings, setCrossings] = useState<Crossing[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("20220101");
  const [endDate, setEndDate] = useState<string>("20221231");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tollStations, setTollStations] = useState<{
    [key: string]: { locality: string; operator: string };
  }>({});

  // Φέρνουμε το OpID από το localStorage
  const storedOpID = localStorage.getItem("OpID");
  // Μετατρέπουμε το "null" string σε πραγματικό null για τον admin
  const userOpID = storedOpID === "null" ? null : storedOpID; // Admin -> null, Users -> 'OpID'

  useEffect(() => {
    const fetchTollStations = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("No authentication token found.");
          return;
        }
        
        // Λέμε ρητά ότι το response.data είναι πίνακας από TollStation
        const response = await api.get<TollStation[]>("/admin/tollstations", {
          headers: { "X-OBSERVATORY-AUTH": token },
        });
  
        const stationsData = response.data;  // τώρα το βλέπει ως TollStation[]
  
        const stationsMap = stationsData.reduce((acc: any, station) => {
          acc[station.TollID] = {
            locality: station.Locality || "N/A",
            operator: station.OpID || "N/A",
          };
          return acc;
        }, {});
  
        console.log("Toll Stations Map:", stationsMap);
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
  
        // Χρησιμοποιούμε γενικό στο get
        const response = await api.get<TollStation[]>("/admin/tollstations", {
          headers: { "X-OBSERVATORY-AUTH": token },
        });
  
        // Εδώ πλέον μπορούμε να χαρτογραφήσουμε ασφαλώς
        const stationsData = response.data; 
        const uniqueOperators = Array.from(
          new Set(stationsData.map((op) => op.OpID))
        );
  
        setOperators(uniqueOperators);        
        setSelectedOperator(uniqueOperators[0] || "");
      } catch (error) {
        console.error("Error fetching operators:", error);
      }
    };
  
    fetchTollStations();
    fetchOperators();
  }, []);
  

  const fetchCrossings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found.");
        return;
      }

      console.log(
        "Fetching crossings for:",
        selectedOperator,
        startDate,
        endDate
      );

      // Έλεγχος στα dates (να έχουν format YYYYMMDD, αλλιώς default)
      const formatDate = (date: string) => {
        if (!date || date.length !== 8) {
          return "20220101";
        }
        return date;
      };

      const formattedStart = formatDate(startDate);
      const formattedEnd = formatDate(endDate);

      console.log("📌 Formatted Start Date:", formattedStart);
      console.log("📌 Formatted End Date:", formattedEnd);

      // Αν είναι απλός χρήστης, χρησιμοποιεί το δικό του OpID
      // Διαφορετικά (admin), παίρνει ό,τι διάλεξε από το dropdown
      const operatorToUse = userOpID !== null ? userOpID : selectedOperator;

      // Request στο backend
      const response = await api.get(
        `/passAnalysis/stationOpID/${operatorToUse}/tagOpID/${operatorToUse}/date_from/${formattedStart}/date_to/${formattedEnd}`,
        {
          headers: { "X-OBSERVATORY-AUTH": token },
        }
      );

      console.log("📌 API Response:", response.data);

      // Έλεγχος αν το response.data είναι array και αν έχει δεδομένα
      if (Array.isArray(response.data) && response.data.length > 0) {
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

      {/* Μόνο για admin δείχνουμε το dropdown */}
      {userOpID === null && (
        <Form.Group controlId="operatorSelect" className="mb-3">
          <Form.Label>Επιλογή Εταιρείας Διοδίων</Form.Label>
          <Form.Select
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
          >
            {operators.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      )}

      {/* Αν είναι user, δείχνουμε το δικό του OpID */}
      {userOpID !== null && (
        <p>
          Εμφάνιση διελεύσεων για την εταιρεία: <strong>{userOpID}</strong>
        </p>
      )}

      {/* Ένα κουμπί για να "φορτώσει" τις διελεύσεις με βάση τα φίλτρα */}
      <Button onClick={fetchCrossings} variant="primary" className="mb-3">
        Εφαρμογή Φίλτρων
      </Button>

      {/* Προαιρετική εμφάνιση λάθους αν υπάρχει */}
      {error && <p className="text-danger">{error}</p>}

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
          {crossings.map((crossing, index) => (
            <tr key={index}>
              {/* stationID, timestamp κ.λπ. μπορεί να είναι κενά, άρα βάζουμε "N/A" */}
              <td>{crossing.stationID || "N/A"}</td>
              <td>{crossing.timestamp || "N/A"}</td>
              <td>{tollStations[crossing.stationID]?.locality || "N/A"}</td>
              <td>{tollStations[crossing.stationID]?.operator || "N/A"}</td>
              <td>{(crossing.passCharge ?? 0).toFixed(2)} €</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Προαιρετικά μπορείτε να βάλετε ένα loading indicator, π.χ. */}
      {loading && <p>Φόρτωση...</p>}
    </Container>
  );
};

export default Crossings;
