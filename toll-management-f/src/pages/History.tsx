// src/pages/History.tsx
import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import api from "../api/api";

// Interface for a payment history log entry
interface PaymentLog {
  paymentDate: string;
  payer: string;
  recipient: string;
  amountPaid: number;
}

const History: React.FC = () => {
  const [history, setHistory] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Assume an API endpoint that returns payment history
        const response = await api.get("/admin/paymentHistory");
        // The API should return an array of PaymentLog objects.
        setHistory(response.data);
      } catch (err: any) {
        console.error("Error fetching payment history", err);
        setError("Failed to fetch payment history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Payment History</h1>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Payment Date</th>
            <th>Payer</th>
            <th>Recipient</th>
            <th>Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          {history.map((log, index) => (
            <tr key={index}>
              <td>{log.paymentDate}</td>
              <td>{log.payer}</td>
              <td>{log.recipient}</td>
              <td>${log.amountPaid.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default History;
