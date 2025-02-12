import React, { useEffect, useState } from "react";
import api from "../api/api"; // Import axios instance

const History = () => {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const response = await api.get("/admin/debts");
      const filteredDebts = response.data.filter((debt) => debt.is_paid); // Exclude unpaid debts
      setDebts(filteredDebts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">
        Debt History
      </h1>
      {loading && <p>Loading debts...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Record Date</th>
            <th className="border px-4 py-2">Company Name</th>
            <th className="border px-4 py-2">Creditor Company</th>
            <th className="border px-4 py-2">Amount Owed (€)</th>
            <th className="border px-4 py-2">Updated At</th>
          </tr>
        </thead>
        <tbody>
          {debts.length > 0 ? (
            debts.map((debt) => (
              <tr key={debt.id}>
                <td className="border px-4 py-2">{debt.id}</td>
                <td className="border px-4 py-2">{debt.record_date}</td>
                <td className="border px-4 py-2">{debt.company_name}</td>
                <td className="border px-4 py-2">{debt.creditor_company}</td>
                <td className="border px-4 py-2">
                  {debt.amount_owed.toFixed(2)}
                </td>
                <td className="border px-4 py-2">
                  {debt.updated_at ? debt.updated_at : "N/A"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="6"
                className="border px-4 py-2 text-center text-gray-500"
              >
                No paid debts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default History;
