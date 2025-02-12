import React, { useEffect, useState } from "react";
import { Table, Button, Form, Modal } from "react-bootstrap";
import api from "../api/api";
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

const UsersDebtsOverview: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Φίλτρα
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedCreditor, setSelectedCreditor] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal πληρωμής
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  const username = localStorage.getItem("authUsername") || "";
  const navigate = useNavigate();

  // -------------------------------------------------
  // Αρχική ανάκτηση οφειλών
  // -------------------------------------------------
  useEffect(() => {
    fetchDebts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------
  // Συνάρτηση για ανάκτηση οφειλών (debts) με φίλτρα
  // -------------------------------------------------
  const fetchDebts = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found.");
        setLoading(false);
        return;
      }

      const headers = { headers: { "X-OBSERVATORY-AUTH": token } };
      const queryParams = new URLSearchParams();

      if (selectedCompany) queryParams.append("company", selectedCompany);
      if (selectedCreditor) queryParams.append("creditor", selectedCreditor);
      if (selectedStatus) queryParams.append("is_paid", selectedStatus);
      if (startDate) queryParams.append("start_date", startDate);
      if (endDate) queryParams.append("end_date", endDate);

      const response = await api.get(`/admin/debts?${queryParams.toString()}`, headers);
      console.log("🔹 [User] Debts API Response:", response.data);

      setDebts(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error("Error fetching debts:", err.response ? err.response.data : err.message);
      setError("Failed to fetch debts (User).");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------
  // Πληρωμή Οφειλής
  // -------------------------------------------------
  const handlePayDebt = async () => {
    if (!selectedDebt) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found.");
        return;
      }

      const headers = { headers: { "X-OBSERVATORY-AUTH": token } };
      const response = await api.put(
        `/admin/debts/${selectedDebt.id}/pay`,
        {},
        headers
      );

      if (response.status === 200) {
        // ✅ Κλείνουμε το modal
        setShowModal(false);

        // ✅ Ξανακάνουμε fetch για να ενημερωθεί άμεσα ο πίνακας οφειλών
        await fetchDebts();
      }
    } catch (err: any) {
      console.error("Error updating debt:", err.response ? err.response.data : err.message);
      setError("Failed to update debt (User).");
    }
  };

  // -------------------------------------------------
  // Συγκεντρώνουμε τις μοναδικές τιμές από το debts
  // -------------------------------------------------
  const allDebtors = Array.from(new Set(debts.map((d) => d.company_name)));
  const allCreditors = Array.from(new Set(debts.map((d) => d.creditor_company)));

  // Ξεκινάμε με όλα τα πιθανά
  let filteredCompanies = [...allDebtors];
  let filteredCreditors = [...allCreditors];

  // -------------------------------------------------
  // Περιορισμοί όταν ΔΕΝ είμαστε admin
  // -------------------------------------------------
  if (username !== "admin") {
    // 1) Αν ο χρήστης επέλεξε συγκεκριμένη Πιστώτρια
    if (selectedCreditor) {
      if (selectedCreditor === username) {
        // User διάλεξε τον εαυτό του σαν πιστώτρια
        // => στο άλλο φίλτρο, εμφανίζονται όλες οι υπόλοιπες, εκτός από τον user
        filteredCompanies = filteredCompanies.filter((c) => c !== username);
      } else {
        // User διάλεξε μία άλλη εταιρεία σαν πιστώτρια
        // => μόνο ο user μπορεί να χρωστάει
        filteredCompanies = [username];
      }
    }

    // 2) Αν ο χρήστης επέλεξε συγκεκριμένη Εταιρεία που Χρωστάει
    if (selectedCompany) {
      if (selectedCompany === username) {
        // Ο user έβαλε τον εαυτό του ως οφειλέτη
        // => στο άλλο φίλτρο, εμφανίζονται όλες οι υπόλοιπες, εκτός του user
        filteredCreditors = filteredCreditors.filter((cr) => cr !== username);
      } else {
        // Έβαλε κάποια άλλη σαν οφειλέτη
        // => ο user είναι η μοναδική πιστώτρια
        filteredCreditors = [username];
      }
    }
  }

  // -------------------------------------------------
  // Render
  // -------------------------------------------------
  return (
    <div className="container mt-5">
      <h1 className="mb-4">Debts Overview</h1>
      {error && <p className="text-danger">{error}</p>}

      {/* Φίλτρα */}
      <div className="mb-4">
        <Form.Group controlId="companySelect" className="mb-3">
          <Form.Label>Company in Debt</Form.Label>
          <Form.Select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="">All</option>
            {filteredCompanies.map((company) => (
              <option key={company} value={String(company)}>
                {String(company)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="creditorSelect" className="mb-3">
          <Form.Label>Creditor Company</Form.Label>
          <Form.Select
            value={selectedCreditor}
            onChange={(e) => setSelectedCreditor(e.target.value)}
          >
            <option value="">All</option>
            {filteredCreditors.map((creditor) => (
              <option key={creditor} value={String(creditor)}>
                {String(creditor)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="statusSelect" className="mb-3">
          <Form.Label>Debt Status</Form.Label>
          <Form.Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="true">Paid</option>
            <option value="false">Pending</option>
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="startDate" className="mb-3">
          <Form.Label>Start Date</Form.Label>
          <Form.Control
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="endDate" className="mb-3">
          <Form.Label>End Date</Form.Label>
          <Form.Control
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Form.Group>

        <Button onClick={fetchDebts} variant="primary">
          Apply Filters
        </Button>
      </div>

      {/* Πίνακας Οφειλών */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
            <th>Date</th>
            <th>Company in Debt</th>
            <th>Creditor Company</th>
            <th>Amount (€)</th>
            <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {debts.map((debt) => (
              <tr key={debt.id}>
                <td>{new Date(debt.record_date).toLocaleDateString()}</td>
                <td>{debt.company_name}</td>
                <td>{debt.creditor_company}</td>
                <td>
                  {debt.amount_owed
                    ? `${Number(debt.amount_owed).toFixed(2)} €`
                    : "N/A"}
                </td>
                <td>
                  {debt.is_paid ? (
                    <span className="text-success">Paid</span>
                  ) : debt.can_pay ? (
                    // Κουμπί πληρωμής ΜΟΝΟ αν can_pay === true
                    <Button
                      variant="warning"
                      onClick={() => {
                        setSelectedDebt(debt);
                        setShowModal(true);
                      }}
                    >
                      Pay
                    </Button>
                  ) : (
                    <span className="text-danger">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal Επιβεβαίωσης Πληρωμής */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Payment Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to pay this debt?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handlePayDebt}>
            Yes, Pay
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UsersDebtsOverview;
