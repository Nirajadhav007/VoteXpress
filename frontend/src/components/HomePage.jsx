import React from "react";

const HomePage = ({ votes, setVotes, user, setUser, showNotification, error }) => {
  const handleVote = async (voteId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/vote/${voteId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to vote");
      }

      // Update votes in state
      setVotes((prev) =>
        prev.map((v) => (v?._id === data?.vote?._id ? data?.vote : v))
      );

      // Update user info after voting
      setUser(data?.user);

      showNotification("Vote submitted successfully 🗳️", "success");
    } catch (error) {
      console.error("Vote error:", error);
      showNotification(error.message, "error");
    }
  };

  return (
    <div className="votes-page">
      {error && <div className="error-message">{error}</div>}

      <div className="votes-grid">
        {votes?.length > 0 ? (
          votes.map((vote, index) => (
            <div className="vote-card" key={index}>
              <h3>{vote.option}</h3>
              <p className="vote-count">Votes: {vote.votes}</p>
              <p className="createdBy">Created By: {vote.createdBy?.email}</p>

              <button
                className={`vote-btn ${
                  !user || user?.votedFor ? "disabled" : ""
                }`}
                disabled={!user || !!user?.votedFor}
                onClick={() => handleVote(vote?._id)}
              >
                {vote?._id === user?.votedFor ? "Voted" : "Vote"}
              </button>
            </div>
          ))
        ) : (
          <p>No votes available</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
