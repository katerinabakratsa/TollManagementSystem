import React, { useEffect, useState } from "react";
import { Container, Table, Form, Button } from "react-bootstrap";
import api from "../api/api";

interface Crossing {
  stationID: string;
  timestamp: string;
  locality: string;
  tagProvider: string;   // Πραγματικός πάροχος tag (εφόσον το backend το στέλνει)
  passCharge: number;
}

interface TollStation {
  TollID: string;
  Locality: string;
  OpID: string;
}

const UserCrossings: React.FC = () => {
  // ----------------------------------------------------------
  // States
  // ----------------------------------------------------------
  const [crossings, setCrossings] = useState<Crossing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Τυχόν operators που υπάρχουν — θα βάλουμε και “Όλες”
  const [operators, setOperators] = useState<string[]>([]);
  const [selectedTagOp, setSelectedTagOp] = useState<string>("");  // φίλτρο για Tag Operator

  // Φίλτρα ημερομηνιών
  const [startDate, setStartDate] = useState<string>("20220101");
  const [endDate, setEndDate] = useState<string>("20221231");

  // Χάρτης stationID -> (locality, operator)
  const [tollStations, setTollStations] = useState<{
    [key: string]: { locality: string; operator: string };
  }>({});

  // ----------------------------------------------------------
  // User: παίρνουμε το OpID από το localStorage (π.χ. "AO")
  // ----------------------------------------------------------
  const storedOpID = localStorage.getItem("OpID") || "";
  // Εδώ υποθέτουμε ότι ΔΕΝ είναι "null" => δεν είναι admin
  const userOpID = storedOpID;

  // ----------------------------------------------------------
  // 1) useEffect -> Φέρνουμε tollStations, operators
  // ----------------------------------------------------------
  useEffect(() => {
    const fetchTollStations = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        // Παίρνουμε όλα τα stations
        const response = await api.get<TollStation[]>("/admin/tollstations", {
          headers: { "X-OBSERVATORY-AUTH": token },
        });
        const stationsData = response.data;

        // Φτιάχνουμε τον χάρτη για locality, operator
        const stationsMap = stationsData.reduce((acc, st) => {
          acc[st.TollID] = {
            locality: st.Locality || "N/A",
            operator: st.OpID || "N/A",
          };
          return acc;
        }, {} as { [key: string]: { locality: string; operator: string } });
        setTollStations(stationsMap);

        // Μοναδικά OpID
        const uniqueOps = Array.from(new Set(stationsData.map((s) => s.OpID)));

        // Αφαιρούμε το userOpID από εκεί, για να το βάλουμε ξεχωριστά
        const otherOps = uniqueOps.filter((op) => op !== userOpID);

        // Ο user βλέπει:
        // - "" => Όλες
        // - userOpID => (εγώ)
        // - ...otherOps
        setOperators(["", userOpID, ...otherOps]);

        // αρχικά => selectedTagOp = userOpID (βλέπει μόνο δικά του tag)
        setSelectedTagOp(userOpID);

      } catch (err) {
        console.error("Error fetching toll stations:", err);
      }
    };

    fetchTollStations();
  }, [userOpID]);

  // ----------------------------------------------------------
  // 2) Συνάρτηση fetchCrossings -> Εφαρμογή Φίλτρων
  // ----------------------------------------------------------
  const fetchCrossingsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found.");
        return;
      }

      // format τις ημερομηνίες
      const formatDate = (d: string) => (d && d.length === 8 ? d : "20220101");
      const fromD = formatDate(startDate);
      const toD = formatDate(endDate);

      // stationOp => userOpID (πάντα, δεν εμφανίζεται καν φίλτρο Station)
      const stationOpID = userOpID;

      let allCrosses: Crossing[] = [];

      if (selectedTagOp === "") {
        // "" => Όλες οι εταιρείες => many calls
        const opsToFetch = operators.filter((op) => op !== ""); // αφαιρούμε το ""
        for (const tOp of opsToFetch) {
          const arr = await callPassAnalysis(stationOpID, tOp, fromD, toD, token);
          allCrosses = [...allCrosses, ...arr];
        }
      } else {
        // μία μόνο κλήση => stationOp = user, tagOp = selectedTagOp
        const result = await callPassAnalysis(stationOpID, selectedTagOp, fromD, toD, token);
        allCrosses = result;
      }

      setCrossings(allCrosses);
    } catch (err) {
      console.error("API error:", err);
      setError("Failed to fetch user crossings.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // 3) Βοηθητική: callPassAnalysis
  // ----------------------------------------------------------
  const callPassAnalysis = async (
    stOp: string,
    tagOp: string,
    fromDate: string,
    toDate: string,
    token: string
  ): Promise<Crossing[]> => {
    const url = `/passAnalysis2/stationOpID/${stOp}/tagOpID/${tagOp}/date_from/${fromDate}/date_to/${toDate}`;
    const resp = await api.get(url, { headers: { "X-OBSERVATORY-AUTH": token } });

    if (!Array.isArray(resp.data) || resp.data.length === 0) {
      return [];
    }
    // passList
    const passList = resp.data[0].passList || [];
    // Μετατροπή σε Crossing
    const mapped: Crossing[] = passList.map((p: any) => ({
      stationID: p.stationID || "N/A",
      timestamp: p.timestamp || "N/A",
      tagProvider: p.tagProvider || "N/A", // αν το backend στέλνει p["tagProvider"]
      passCharge: p.passCharge ?? 0,
      locality: tollStations[p.stationID]?.locality ?? "N/A",
    }));
    return mapped;
  };

  // ----------------------------------------------------------
  // useEffect (αρχικό) => Κάθε φορά που φορτώνεται,
  // μπορούμε αν θέλουμε να φορτώνουμε τα crossings
  // ----------------------------------------------------------
  useEffect(() => {
    fetchCrossingsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------
  return (
    <Container className="mt-5">
      <h1 className="text-center">Οι Διελεύσεις μου</h1>
      <p>
        Εμφάνιση διελεύσεων για Station Operator: <strong>{userOpID}</strong> (μόνο εσύ)
      </p>

      {error && <p className="text-danger">{error}</p>}

      {/* Φίλτρα: Ημερομηνίες */}
      <Form.Group className="mb-3" controlId="startDate">
        <Form.Label>Ημερομηνία Έναρξης (YYYYMMDD)</Form.Label>
        <Form.Control
          type="text"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="endDate">
        <Form.Label>Ημερομηνία Λήξης (YYYYMMDD)</Form.Label>
        <Form.Control
          type="text"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </Form.Group>

      {/* Φίλτρο Tag Operator */}
      <Form.Group className="mb-3" controlId="tagOpSelect">
        <Form.Label>Tag Operator (Πάροχος)</Form.Label>
        <Form.Select
          value={selectedTagOp}
          onChange={(e) => setSelectedTagOp(e.target.value)}
        >
          <option value="">Όλες</option>
          {operators
            .filter((op) => op !== "") // αφαιρούμε το "" το οποίο σημαίνει «Όλες»
            .map((op) => (
              <option key={op} value={op}>
                {op === userOpID ? `${op} (εγώ)` : op}
              </option>
            ))}
        </Form.Select>
      </Form.Group>

      <Button variant="primary" className="mb-3" onClick={fetchCrossingsData}>
        Εφαρμογή Φίλτρων
      </Button>

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
          {crossings.length > 0 ? (
            crossings.map((cross, index) => (
              <tr key={index}>
                <td>{cross.stationID}</td>
                <td>{cross.timestamp}</td>
                <td>{cross.locality}</td>
                <td>{cross.tagProvider}</td>
                <td>{cross.passCharge.toFixed(2)} €</td>
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
      {loading && <p>Φόρτωση δεδομένων...</p>}
    </Container>
  );
};

export default UserCrossings;
