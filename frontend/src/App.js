import { useContext, useState, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";
import socketIOClient from "socket.io-client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import AdminPanel from "./components/AdminPanel";
import RegisterPage from "./components/RegisterPage";

// ✅ Check environment variable
console.log("API Base URL:", process.env.REACT_APP_API);

function App() {
  const { user, logout, login, setUser } = useContext(AuthContext);
  const [votes, setVotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "info",
  });

  // ✅ Socket connection
  const socket = socketIOClient(process.env.REACT_APP_API, {
    transports: ["websocket"],
    withCredentials: true,
  });

  // ✅ Fetch votes from backend
  const fetchVotes = async () => {
    try {
      const API_URL = `${process.env.REACT_APP_API}/api/votes`; // ✅ Fixed variable name
      console.log("Fetching from:", API_URL);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch votes");

      const data = await response.json();
      setVotes(data);
    } catch (error) {
      console.error("Error fetching votes:", error);
      setError(error?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVotes();

    // ✅ Real-time updates from backend
    socket.on("voteUpdated", (updatedVote) => {
      setVotes((prev) =>
        prev.map((v) => (v?._id === updatedVote?._id ? updatedVote : v))
      );
      showNotification("Vote Updated!", "info");
    });

    socket.on("voteCreated", (newVote) => {
      setVotes((prev) => [...prev, newVote]);
      showNotification("New Vote option added!", "success");
    });

    socket.on("voteDeleted", (voteId) => {
      setVotes((prev) => prev.filter((item) => item._id !== voteId));
      showNotification("Vote deleted successfully!", "success");
    });

    // ✅ Cleanup
    return () => {
      socket.off("voteUpdated");
      socket.off("voteCreated");
      socket.off("voteDeleted");
    };
  }, []); // Run once

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 3000);
  };

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <Router>
      <div className="app-container">
        <Header user={user} logout={logout} showNotification={showNotification} />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  votes={votes}
                  showNotification={showNotification}
                  error={error}
                  user={user}
                  setUser={setUser}
                  setVotes={setVotes}
                />
              }
            />
            <Route
              path="/login"
              element={
                user?.role === "admin" ? (
                  <Navigate to="/admin" />
                ) : user ? (
                  <Navigate to="/" />
                ) : (
                  <LoginPage login={login} showNotification={showNotification} />
                )
              }
            />
            <Route
              path="/register"
              element={
                user ? (
                  <Navigate to="/" />
                ) : (
                  <RegisterPage login={login} showNotification={showNotification} />
                )
              }
            />
            {user?.role === "admin" && (
              <Route
                path="/admin"
                element={
                  <AdminPanel
                    votes={votes}
                    showNotification={showNotification}
                    setVotes={setVotes}
                  />
                }
              />
            )}
          </Routes>
        </main>

        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;