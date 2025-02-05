import axios from "axios";

const API_BASE_URL = "https://localhost:9115/api"; // Βάλε τη σωστή διεύθυνση του backend

export const getTollStations = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/toll-stations`);
        return response.data;
    } catch (error) {
        console.error("Error fetching toll stations:", error);
        return [];
    }
};

export const getUserDebts = async (userId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/debts/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching user debts:", error);
        return [];
    }
};
