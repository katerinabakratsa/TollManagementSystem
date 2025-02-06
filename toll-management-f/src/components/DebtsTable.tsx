// src/components/DebtsTable.tsx
import React from "react";
import { Table } from "react-bootstrap";

interface Debt {
  creditor: string;
  amount: number;
  status: string;
  date: string;
}

interface DebtsTableProps {
  debts: Debt[];
}

const DebtsTable: React.FC<DebtsTableProps> = ({ debts }) => {
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Creditor</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {debts.map((debt, index) => (
          <tr key={index}>
            <td>{debt.creditor}</td>
            <td>${debt.amount.toFixed(2)}</td>
            <td>{debt.status}</td>
            <td>{debt.date}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default DebtsTable;
