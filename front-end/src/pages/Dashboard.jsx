import { useEffect, useState } from "react";
import { getTollStations } from "../services/api";

function Dashboard() {
    const [stations, setStations] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const data = await getTollStations();
            setStations(data);
        }
        fetchData();
    }, []);

    return (
        <div>
            <h1>Καλώς ήρθατε στο Dashboard!</h1>
            <ul>
                {stations.map((station, index) => (
                    <li key={index}>{station.name}</li>
                ))}
            </ul>
        </div>
    );
}

export default Dashboard;
