import React, { useEffect, useState } from "react";
import { Table, Button, Container } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

const DebtSettlement: React.FC = () => {
  const { date, company } = useParams<{ date: string; company: string }>();
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const response = await api.get(
          `/passesCost/${company}/ALL/${date}/${date}`
        );
        setDebts(response.data);
      } catch (err) {
        setError("Failed to fetch inter-company debts.");
      } finally {
        setLoading(false);
      }
    };
    fetchDebts();
  }, [date, company]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <Container>
      <h1>
        Debt Settlement for {company} on {date}
      </h1>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Company</th>
            <th>Total Passes</th>
            <th>Total Cost</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {debts.map((debt, index) => (
            <tr key={index}>
              <td>{debt.tagOpID}</td>
              <td>{debt.nPasses}</td>
              <td>${debt.passesCost.toFixed(2)}</td>
              <td>
                <Button
                  variant="success"
                  onClick={async () => {
                    try {
                      await api.post(
                        `/settleDebt/${company}/${debt.tagOpID}/${date}`
                      );
                      alert("Payment successful!");
                    } catch (err) {
                      alert("Payment failed.");
                    }
                  }}
                >
                  Pay
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default DebtSettlement;
