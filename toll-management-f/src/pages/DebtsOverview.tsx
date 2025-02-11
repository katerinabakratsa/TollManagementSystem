// src/pages/DebtsOverview.tsx
import React, { useEffect, useState } from "react";
import { Table, Button, Form, Modal } from "react-bootstrap";
import api from "../api/api"; // Axios instance (configured with baseURL, headers, etc.)
import { useNavigate } from "react-router-dom";

interface Debt {
  id: number;
  record_date: string;
  company_name: string;
  creditor_company: string;
  amount_owed: number;
  is_paid: boolean;
  can_pay: boolean;
}

const DebtsOverview: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedCreditor, setSelectedCreditor] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const username = localStorage.getItem("authUsername") || ""; // Το username ισούται με το OpId
  const navigate = useNavigate();

  useEffect(() => {
    fetchDebts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDebts = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found.");
        setLoading(false);
        return;
      }

      const headers = { headers: { "X-OBSERVATORY-AUTH": token } };
      let queryParams = new URLSearchParams();

      if (selectedCompany) queryParams.append("company", selectedCompany);
      if (selectedCreditor) queryParams.append("creditor", selectedCreditor);
      if (selectedStatus) queryParams.append("is_paid", selectedStatus);
      if (startDate) queryParams.append("start_date", startDate);
      if (endDate) queryParams.append("end_date", endDate);

      const response = await api.get(`/admin/debts?${queryParams.toString()}`, headers);
      console.log("🔹 API Response:", response.data); // Δες αν το can_pay έρχεται σωστά
      setDebts(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error("Error fetching debts:", err.response ? err.response.data : err.message);
      setError("Failed to fetch debts.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayDebt = async () => {
    if (!selectedDebt) return;
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found.");
        return;
      }

      const headers = { headers: { "X-OBSERVATORY-AUTH": token } };
      const response = await api.put(`/admin/debts/${selectedDebt.id}/pay`, {}, headers);

      if (response.status === 200) {
        const updatedDebt = response.data;
        setDebts((prevDebts) =>
          prevDebts.map((debt) =>
            debt.id === updatedDebt.id
              ? { ...debt, is_paid: true, can_pay: false } // Αλλαγή στο UI
              : debt
          )
        );
      }

      setShowModal(false);
    } catch (err: any) {
      console.error("Error updating debt:", err.response ? err.response.data : err.message);
      setError("Failed to update debt.");
    }
  };

// -------------------------------------------------
  // Συγκεντρώνουμε τις μοναδικές τιμές που υπάρχουν
  // -------------------------------------------------
  const allDebtors = Array.from(new Set(debts.map((d) => d.company_name)));
  const allCreditors = Array.from(new Set(debts.map((d) => d.creditor_company)));

  // Για να ξεκινήσουμε, οι λίστες μας είναι οι “full” λίστες
  let filteredCompanies = [...allDebtors];
  let filteredCreditors = [...allCreditors];

  // -------------------------------------------------
  // Αν είμαστε admin, δεν βάζουμε κανέναν περιορισμό.
  // Αν δεν είμαστε admin, εφαρμόζουμε την επιθυμητή λογική:
  // -------------------------------------------------
  if (username !== "admin") {
    // *** 1) Φιλτράρισμα με βάση την επιλογή Πιστώτριας ***
    if (selectedCreditor) {
      if (selectedCreditor === username) {
        // Ο χρήστης έχει βάλει τον εαυτό του ως πιστώτρια εταιρεία
        // => Στο άλλο φίλτρο (ετ. που χρωστάει) μένουν ΟΛΕΣ οι υπόλοιπες
        //    εκτός από τον ίδιο τον user. (Κι εννοείται έχουμε πάντα <option value="">Όλες</option>)
        filteredCompanies = filteredCompanies.filter((c) => c !== username);
      } else {
        // Ο χρήστης διάλεξε μία άλλη εταιρεία σαν πιστώτρια
        // => Άρα ο user είναι ο μοναδικός που μπορεί να χρωστάει
        //    (μαζί με την "" = Όλες στο dropdown, αλλά η μόνη πραγματική τιμή είναι ο user)
        filteredCompanies = [username];
      }
    }

    // *** 2) Φιλτράρισμα με βάση την επιλογή Εταιρείας που Χρωστάει ***
    if (selectedCompany) {
      if (selectedCompany === username) {
        // Ο χρήστης έχει βάλει τον εαυτό του ως Εταιρεία που Χρωστάει
        // => Στο άλλο φίλτρο (πιστώτρια) μένουν όλες οι υπόλοιπες
        //    εκτός από τον user.
        filteredCreditors = filteredCreditors.filter((cr) => cr !== username);
      } else {
        // Ο χρήστης διάλεξε μία άλλη εταιρεία σαν οφειλέτη
        // => Τότε ο user είναι ο μόνος πιστωτής
        filteredCreditors = [username];
      }
    }
  }


  return (
    <div className="container mt-5">
      <h1 className="mb-4">Debts Overview</h1>
      <div className="mb-4">
        <Form.Group controlId="companySelect" className="mb-3">
          <Form.Label>Εταιρεία που Χρωστάει</Form.Label>
          <Form.Select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="">Όλες</option>
            {filteredCompanies.map((company) => (
              <option key={company} value={String(company)}>{String(company)}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="creditorSelect" className="mb-3">
          <Form.Label>Πιστώτρια Εταιρεία</Form.Label>
          <Form.Select
            value={selectedCreditor}
            onChange={(e) => setSelectedCreditor(e.target.value)}
          >
            <option value="">Όλες</option>
            {filteredCreditors.map((creditor) => (
              <option key={creditor} value={String(creditor)}>{String(creditor)}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="statusSelect" className="mb-3">
          <Form.Label>Κατάσταση Οφειλής</Form.Label>
          <Form.Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Όλα</option>
            <option value="true">Εξοφλήθηκε</option>
            <option value="false">Εκκρεμεί</option>
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="startDate" className="mb-3">
          <Form.Label>Ημερομηνία Έναρξης</Form.Label>
          <Form.Control
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="endDate" className="mb-3">
          <Form.Label>Ημερομηνία Λήξης</Form.Label>
          <Form.Control
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Form.Group>

        <Button onClick={fetchDebts} variant="primary">
          Εφαρμογή Φίλτρων
        </Button>
      </div>

      {/* Πίνακας Οφειλών */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Ημερομηνία</th>
            <th>Εταιρεία που Χρωστάει</th>
            <th>Πιστώτρια Εταιρεία</th>
            <th>Ποσό (€)</th>
            <th>Κατάσταση</th>
          </tr>
        </thead>
        <tbody>
          {debts.map((debt) => (
            <tr key={debt.id}>
              <td>{new Date(debt.record_date).toLocaleDateString()}</td>
              <td>{debt.company_name}</td>
              <td>{debt.creditor_company}</td>
              <td>{debt.amount_owed ? `${Number(debt.amount_owed).toFixed(2)} €` : "N/A"}</td>
              <td>
                {debt.is_paid ? (
                  <span className="text-success">Εξοφλήθηκε</span>
                ) : debt.can_pay ? (
                  <Button
                    variant="warning"
                    onClick={() => {
                      console.log("Button clicked", debt);
                      setSelectedDebt(debt);
                      setShowModal(true);
                    }}
                  >
                    Πληρωμή
                  </Button>
                ) : (
                  <span className="text-danger">Εκκρεμεί</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Μόνταλ Επιβεβαίωσης Πληρωμής */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Επιβεβαίωση Πληρωμής</Modal.Title>
        </Modal.Header>
        <Modal.Body>Είστε σίγουροι ότι θέλετε να εξοφλήσετε αυτή την οφειλή;</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Ακύρωση
          </Button>
          <Button variant="primary" onClick={handlePayDebt}>
            Ναι, Πληρωμή
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DebtsOverview;
