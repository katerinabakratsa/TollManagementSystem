// src/components/LiveData.tsx

import React, { useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import api from "../api/api";

const LiveData: React.FC = () => {
  const { totalTollStations, setTotalTollStations, loading, setLoading } =
    useContext(AppContext);

  useEffect(() => {
    const fetchTotalTollStations = async () => {
      setLoading(true);
      try {
        const response = await api.get("/admin/tollstations");
        if (Array.isArray(response.data)) {
          setTotalTollStations(response.data.length);
        } else {
          console.error("Unexpected response format:", response.data);
        }
      } catch (error) {
        console.error("Failed to fetch toll stations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalTollStations();
  }, [setTotalTollStations, setLoading]);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <p>Total Toll Stations: {totalTollStations}</p>
      )}
    </div>
  );
};

export default LiveData;
