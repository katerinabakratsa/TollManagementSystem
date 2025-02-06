// src/pages/DebtsPage.tsx
import React, { useEffect, useState } from "react";
import DebtsTable from "../components/DebtsTable";
import { Container } from "react-bootstrap";
import api from "../api/api";

interface Debt {
  creditor: string;
  amount: number;
  status: string;
  date: string;
}

const DebtsPage: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch debts from the backend
  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const response = await api.get("/debts"); // Ensure this endpoint exists
        setDebts(response.data);
      } catch (err: any) {
        setError("Failed to fetch debts.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDebts();
  }, []);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Debts</h1>
      <DebtsTable debts={debts} />
    </div>
  );
};

export default DebtsPage;
