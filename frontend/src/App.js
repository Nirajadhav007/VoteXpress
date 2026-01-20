import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "./context/AuthContext";
import { io } from "socket.io-client";
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

// ✅ Backend URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://votexpress-1.onrender.com";


console.log("🌍 Using backend:", BACKEND_URL);

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

  // ✅ Keep socket in a ref to avoid reconnecting on every render
  const socketRef = useRef(null);

  // ✅ Initialize socket only once
  useEffect(() => {
    socketRef.current = io(BACKEND_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current.on("connect", () =>
      console.log("✅ Connected to WebSocket:", socketRef.current.id)
    );

    socketRef.current.on("connect_error", (err) =>
      console.error("❌ WebSocket connect error:", err.message)
    );

    return () => {
      socketRef.current.disconnect();
      console.log("🔌 Disconnected WebSocket");
    };
  }, []);

  // ✅ Fetch votes
  const fetchVotes = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/votes`);
      if (!res.ok) throw new Error(`Failed to fetch votes (${res.status})`);
      const data = await res.json();
      setVotes(data);
    } catch (err) {
      console.error("Error fetching votes:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Listen for live updates
  useEffect(() => {
    fetchVotes();

    if (!socketRef.current) return;

    const socket = socketRef.current;

    socket.on("voteUpdated", (updatedVote) => {
      setVotes((prev) =>
        prev.map((v) => (v._id === updatedVote._id ? updatedVote : v))
      );
      showNotification("Vote updated!", "info");
    });

    socket.on("voteCreated", (newVote) => {
      setVotes((prev) => [...prev, newVote]);
      showNotification("New vote option added!", "success");
    });

    socket.on("voteDeleted", (voteId) => {
      setVotes((prev) => prev.filter((v) => v._id !== voteId));
      showNotification("Vote deleted successfully!", "success");
    });

    return () => {
      socket.off("voteUpdated");
      socket.off("voteCreated");
      socket.off("voteDeleted");
    };
  }, []);

  // ✅ Notification function
  const showNotification = (message, type) => {
  setNotification({ show: true, message, type });
  setTimeout(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, 3000);
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
