import React, { useEffect, useState } from "react";
import { Container, Table } from "react-bootstrap";
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

const UserCrossings: React.FC = () => {
  const [crossings, setCrossings] = useState<Crossing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Χάρτης: stationID -> { locality, operator }
  const [tollStations, setTollStations] = useState<{
    [key: string]: { locality: string; operator: string };
  }>({});

  // Διαβάζουμε το OpID του χρήστη από το localStorage (user-only).
  const storedOpID = localStorage.getItem("OpID") || "";
  // (Θεωρούμε ότι εδώ δεν θα είναι "null" string, γιατί αν ήταν admin, δεν θα έμπαινε σε αυτή τη σελίδα.)

  // Σταθερές ημερομηνίες που θέλουμε να καλύψουμε. 
  // Αν θέλεις, μπορείς να τις αλλάξεις ή να τις αφαιρέσεις τελείως από το backend.
  const startDate = "20220101";
  const endDate = "20221231";

  // -----------------------------------------------------------
  // useEffect #1: Φέρνουμε τη λίστα των σταθμών (για εμφάνιση ονομάτων)
  // -----------------------------------------------------------
  useEffect(() => {
    const fetchTollStations = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("No authentication token found.");
          return;
        }

        const response = await api.get<TollStation[]>("/admin/tollstations", {
          headers: { "X-OBSERVATORY-AUTH": token },
        });

        const stationsData = response.data;
        const stationsMap = stationsData.reduce((acc: any, station) => {
          acc[station.TollID] = {
            locality: station.Locality || "N/A",
            operator: station.OpID || "N/A",
          };
          return acc;
        }, {});
        setTollStations(stationsMap);
      } catch (err) {
        console.error("Error fetching toll stations:", err);
      }
    };

    fetchTollStations();
  }, []);

  // -----------------------------------------------------------
  // useEffect #2: Φορτώνουμε αυτόματα τις διελεύσεις του χρήστη
  // -----------------------------------------------------------
  useEffect(() => {
    const fetchCrossings = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("No authentication token found.");
          return;
        }

        // Κάνουμε κλήση στο backend μόνο για τον συγκεκριμένο χρήστη (storedOpID)
        const response = await api.get(
          `/passAnalysis/stationOpID/${storedOpID}/tagOpID/${storedOpID}/date_from/${startDate}/date_to/${endDate}`,
          {
            headers: { "X-OBSERVATORY-AUTH": token },
          }
        );

        // Έλεγχος αν είναι array με αποτελέσματα
        if (Array.isArray(response.data) && response.data.length > 0) {
          setCrossings(response.data[0].passList || []);
        } else {
          setCrossings([]);
        }
      } catch (error) {
        console.error("API error:", error);
        setError("Failed to fetch user crossings.");
      } finally {
        setLoading(false);
      }
    };

    // Αυτόματη κλήση μόλις «ανεβεί» (mount) το component
    fetchCrossings();
  }, [storedOpID]);

  // -----------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------
  return (
    <Container className="mt-5">
      <h1 className="text-center">Οι Διελεύσεις μου</h1>

      {/* Ενημερωτικό μήνυμα για ποια εταιρεία βλέπουμε */}
      <p>Εμφάνιση διελεύσεων για την εταιρεία: <strong>{storedOpID}</strong></p>

      {/* Προαιρετικά, εμφάνιση μηνύματος λάθους */}
      {error && <p className="text-danger">{error}</p>}

      {/* Πίνακας Διελεύσεων */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Σταθμός</th>
            <th>Ημερομηνία</th>
            <th>Τοποθεσία</th>
            <th>Πάροχος</th>
            <th>Κόστος</th>
          </tr>
        </thead>
        <tbody>
          {crossings.map((cross, index) => (
            <tr key={index}>
              <td>{cross.stationID || "N/A"}</td>
              <td>{cross.timestamp || "N/A"}</td>
              <td>{tollStations[cross.stationID]?.locality || "N/A"}</td>
              <td>{tollStations[cross.stationID]?.operator || "N/A"}</td>
              <td>{(cross.passCharge ?? 0).toFixed(2)} €</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {loading && <p>Φόρτωση δεδομένων...</p>}
    </Container>
  );
};

export default UserCrossings;
