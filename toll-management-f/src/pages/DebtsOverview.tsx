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

const AdminDebtsOverview: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Φίλτρα
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedCreditor, setSelectedCreditor] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // (Admin δεν κάνει ποτέ pay, άρα δεν χρειάζεται καν Modal;
  //  αλλά αν θέλουμε να το αφήσουμε, το αφήνουμε. Το βλέπεις εσύ.)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

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
      console.log("🔹 [Admin] Debts API Response:", response.data);

      setDebts(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error("Error fetching debts (Admin):", err.response ? err.response.data : err.message);
      setError("Failed to fetch debts (Admin).");
    } finally {
      setLoading(false);
    }
  };

  // Admin typically doesn't pay any debt, so handlePayDebt might be unused:
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
          prevDebts.map((d) =>
            d.id === updatedDebt.id
              ? { ...d, is_paid: true, can_pay: false }
              : d
          )
        );
      }

      setShowModal(false);
    } catch (err: any) {
      console.error("Error updating debt:", err.response ? err.response.data : err.message);
      setError("Failed to update debt.");
    }
  };

  // Συγκεντρώνουμε τις μοναδικές τιμές (Admin: καμία λογική περιορισμού)
  const allDebtors = Array.from(new Set(debts.map((d) => d.company_name)));
  const allCreditors = Array.from(new Set(debts.map((d) => d.creditor_company)));

  // Admin μπορεί να επιλέξει τα πάντα
  const filteredCompanies = [...allDebtors];
  const filteredCreditors = [...allCreditors];

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Debts Overview (Admin)</h1>
      {error && <p className="text-danger">{error}</p>}

      {/* ΦΙΛΤΡΑ */}
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
                  ) : (
                    <span className="text-danger">Pending</span>
                  )}
                  {/* Προαιρετικά, ο Admin δε χρειάζεται Pay Button */}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      
      
    </div>
  );
};

export default AdminDebtsOverview;
