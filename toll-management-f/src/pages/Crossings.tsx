import React, { useEffect, useState } from "react";
import { Container, Table, Form, Button } from "react-bootstrap";
import api from "../api/api";

// ----------------------------------------------------------
// Δηλώνουμε το interface που περιμένουμε από το backend
// ----------------------------------------------------------
interface Crossing {
  stationID: string;
  timestamp: string;
  locality: string;   // Αν και το passAnalysis δεν επιστρέφει locality, βάζουμε "N/A"
  tagProvider: string; // tagHomeID (πάροχος tag)
  passCharge: number;
}

interface TollStation {
  TollID: string;
  Locality: string;
  OpID: string;
}

const Crossings: React.FC = () => {
  // ----------------------------------------------------------
  // States
  // ----------------------------------------------------------
  const [crossings, setCrossings] = useState<Crossing[]>([]);
  const [operators, setOperators] = useState<string[]>([]);

  // Το combo-box για το "Station OpID"
  const [selectedStationOp, setSelectedStationOp] = useState<string>("");
  // Το combo-box για το "Tag OpID"
  const [selectedTagOp, setSelectedTagOp] = useState<string>("");

  const [startDate, setStartDate] = useState<string>("20220101");
  const [endDate, setEndDate] = useState<string>("20221231");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Αν θέλουμε να δείξουμε locality στο table
  const [tollStations, setTollStations] = useState<{
    [key: string]: { locality: string; operator: string };
  }>({});

  // ----------------------------------------------------------
  // userOpID: "null" => admin, αλλιώς user
  // ----------------------------------------------------------
  const storedOpID = localStorage.getItem("OpID");
  const userOpID = storedOpID === "null" ? null : storedOpID;

  // ----------------------------------------------------------
  // 1) useEffect -> Φέρνουμε tollStations για να βγάλουμε τους operators
  // ----------------------------------------------------------
  useEffect(() => {
    const fetchTollStations = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("No authentication token found.");
          return;
        }

        // Παίρνουμε όλους τους σταθμούς
        const response = await api.get<TollStation[]>("/admin/tollstations", {
          headers: { "X-OBSERVATORY-AUTH": token },
        });
        const stationsData = response.data;

        // Δημιουργία map για locality κ.λπ.
        const stationsMap = stationsData.reduce((acc: any, station) => {
          acc[station.TollID] = {
            locality: station.Locality || "N/A",
            operator: station.OpID || "N/A",
          };
          return acc;
        }, {});
        setTollStations(stationsMap);

        // Βρίσκουμε όλους τους μοναδικούς operators (OpIDs)
        const uniqueOps = Array.from(new Set(stationsData.map((st) => st.OpID)));
        // Βάζουμε "" στην αρχή για την επιλογή «Όλες»
        setOperators(["", ...uniqueOps]);

      } catch (err) {
        console.error("Error fetching toll stations:", err);
      }
    };

    fetchTollStations();
  }, []);

  // ----------------------------------------------------------
  // 2) Συνάρτηση fetchCrossings
  // ----------------------------------------------------------
  const fetchCrossings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found.");
        return;
      }

      // Μορφοποίηση των ημερομηνιών
      const formatDate = (d: string) => (d && d.length === 8 ? d : "20220101");
      const formattedStart = formatDate(startDate);
      const formattedEnd = formatDate(endDate);

      // Αν user => πάντα ο σταθμός & tag = userOpID
      if (userOpID !== null) {
        // Απλός χρήστης (όχι admin)
        const singleStationOp = userOpID;
        const singleTagOp = userOpID;

        // Κάνουμε μόνο ΜΙΑ κλήση
        const arr = await callPassAnalysis(
          singleStationOp,
          singleTagOp,
          formattedStart,
          formattedEnd,
          token
        );
        setCrossings(arr);
      } else {
        // Admin => πολλαπλές κλήσεις αν είναι "Όλες"
        let stationOps: string[] = [];
        let tagOps: string[] = [];

        // Αν διάλεξε "Όλες" => stationOps = όλοι οι operators
        // αλλιώς => stationOps = [selectedStationOp]
        stationOps = selectedStationOp === "" ? operators.slice(1) : [selectedStationOp];
        tagOps = selectedTagOp === "" ? operators.slice(1) : [selectedTagOp];

        console.log("Πραγματικοί stationOps:", stationOps);
        console.log("Πραγματικοί tagOps:", tagOps);

        let allCrossings: Crossing[] = [];
        for (const sOp of stationOps) {
          for (const tOp of tagOps) {
            // πολλαπλή κλήση
            const arr = await callPassAnalysis(
              sOp,
              tOp,
              formattedStart,
              formattedEnd,
              token
            );
            allCrossings = [...allCrossings, ...arr];
          }
        }
        setCrossings(allCrossings);
      }
    } catch (err) {
      setError("Failed to fetch data.");
      console.error("API error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Βοηθητική συνάρτηση για κλήση στο endpoint passAnalysis
  // ----------------------------------------------------------
  const callPassAnalysis = async (
    stationOpID: string,
    tagOpID: string,
    fromD: string,
    toD: string,
    token: string
  ): Promise<Crossing[]> => {
    // Κλήση στο backend
    const resp = await api.get(`/passAnalysis2/stationOpID/${stationOpID}/tagOpID/${tagOpID}/date_from/${fromD}/date_to/${toD}`, 
    { headers: { "X-OBSERVATORY-AUTH": token } });

    let results: Crossing[] = [];
    if (Array.isArray(resp.data) && resp.data.length > 0) {
      const passList = resp.data[0].passList || [];
      results = passList.map((p: any) => ({
        stationID: p.stationID || "N/A",
        timestamp: p.timestamp || "N/A",
        tagProvider: p.tagProvider || "N/A",
        passCharge: p.passCharge ?? 0,
        locality: tollStations[p.stationID]?.locality ?? "N/A",
      }));
    }
    return results;
  };

  // ----------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------
  return (
    <Container className="mt-5">
      <h1 className="text-center">Toll Crossings</h1>

      {/* Μόνο admin βλέπει dropdowns */}
      {userOpID === null && (
        <>
          <Form.Group controlId="stationOperatorSelect" className="mb-3">
            <Form.Label>Επιλογή Εταιρείας Διοδίων (StationOp)</Form.Label>
            <Form.Select
              value={selectedStationOp}
              onChange={(e) => setSelectedStationOp(e.target.value)}
            >
              <option value="">Όλες</option>
              {operators
                .filter((op) => op !== "")
                .map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="tagProviderSelect" className="mb-3">
            <Form.Label>Επιλογή Παρόχου Tag (TagOp)</Form.Label>
            <Form.Select
              value={selectedTagOp}
              onChange={(e) => setSelectedTagOp(e.target.value)}
            >
              <option value="">Όλες</option>
              {operators
                .filter((op) => op !== "")
                .map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>
        </>
      )}

      <Form.Group controlId="startDate" className="mb-3">
        <Form.Label>Ημερομηνία Έναρξης (YYYYMMDD)</Form.Label>
        <Form.Control
          type="text"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </Form.Group>
      <Form.Group controlId="endDate" className="mb-3">
        <Form.Label>Ημερομηνία Λήξης (YYYYMMDD)</Form.Label>
        <Form.Control
          type="text"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </Form.Group>

      <Button onClick={fetchCrossings} variant="primary" className="mb-3">
        Εφαρμογή Φίλτρων
      </Button>

      {error && <p className="text-danger">{error}</p>}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Σταθμός</th>
            <th>Ημερομηνία</th>
            <th>Τοποθεσία</th>
            <th>Πάροχος Tag</th>
            <th>Κόστος</th>
          </tr>
        </thead>
        <tbody>
          {crossings.length > 0 ? (
            crossings.map((item, idx) => (
              <tr key={idx}>
                <td>{item.stationID}</td>
                <td>{item.timestamp}</td>
                <td>{item.locality}</td>
                <td>{item.tagProvider}</td>
                <td>{item.passCharge.toFixed(2)} €</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center">
                Δεν υπάρχουν διελεύσεις για τα επιλεγμένα φίλτρα.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {loading && <p>Φόρτωση...</p>}
    </Container>
  );
};

export default Crossings;
