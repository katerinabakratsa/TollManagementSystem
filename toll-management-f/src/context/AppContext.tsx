// src/context/AppContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from "react";
import axios from "../api/api";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  // New properties added
  totalTollStations: number;
  setTotalTollStations: (count: number) => void;
  loading: boolean;
  setLoading: (state: boolean) => void;
}

export const AppContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  login: () => {},
  logout: () => {},
  totalTollStations: 0,
  setTotalTollStations: () => {},
  loading: false,
  setLoading: () => {},
});

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);

  // New states added
  const [totalTollStations, setTotalTollStations] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // On initial load, check if token exists in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      // Set the token in axios headers
      axios.defaults.headers.common["X-OBSERVATORY-AUTH"] = storedToken;
    }
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    setIsAuthenticated(true);
    localStorage.setItem("authToken", newToken);
    // Set token in axios headers for future requests
    axios.defaults.headers.common["X-OBSERVATORY-AUTH"] = newToken;
  };

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem("authToken");
    // Remove token from axios headers
    delete axios.defaults.headers.common["X-OBSERVATORY-AUTH"];
    // Optionally, make a logout request to the backend
    axios.post("/logout").catch((err) => console.error(err));
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        token,
        login,
        logout,
        totalTollStations,
        setTotalTollStations,
        loading,
        setLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
