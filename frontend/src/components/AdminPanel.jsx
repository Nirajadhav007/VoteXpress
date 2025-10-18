import React, { useState } from "react";

const AdminPanel = ({ votes, setVotes, showNotification }) => {
  const [newOption, setNewOption] = useState("");

  // 🟢 Add a new voting option
  const handleAddOption = async () => {
    if (!newOption.trim()) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/votes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ option: newOption }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to add option");
      }

      // Update state
      setVotes([...votes, data]);
      setNewOption("");
      showNotification("Option added successfully ✅", "success");
    } catch (error) {
      console.error("Add option error:", error);
      showNotification(error.message, "error");
    }
  };

  // 🔴 Delete a voting option
  const handleDeleteOption = async (id) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/vote/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete option");
      }

      // Update votes after delete
      setVotes(votes.filter((vote) => vote._id !== id));
      showNotification("Option deleted successfully 🗑️", "success");
    } catch (error) {
      console.error("Delete option error:", error);
      showNotification(error.message, "error");
    }
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>

      <div className="add-option-form">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="New voting option"
        />
        <button onClick={handleAddOption}>Add Option</button>
      </div>

      <div className="current-options">
        <h3>Current Voting Options</h3>
        {votes.length > 0 ? (
          votes.map((vote) => (
            <div className="option-item" key={vote._id}>
              <span>{vote.option}</span>
              <span>Votes: {vote.votes}</span>
              <button
                onClick={() => handleDeleteOption(vote._id)}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p>No voting options available</p>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
