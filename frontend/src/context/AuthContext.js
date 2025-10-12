import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to initialize authentication
  const initializeAuth = async () => {
    const token = localStorage.getItem("token");
    console.log(token, "token");

    if (token) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.log("Auth initialization error", error);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    } else {
      // If no token, set loading to false
      setLoading(false);
    }
  };

  // Run initialization when component mounts
  useEffect(() => {
    initializeAuth();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};