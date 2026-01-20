const mongoose = require("mongoose");

let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) return;

  try {
    console.log("⏳ Connecting to MongoDB...");
    console.log("URI:", process.env.DATABASE_URI);

    const conn = await mongoose.connect(process.env.DATABASE_URI);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    isConnected = true;
  } catch (error) {
    console.error("❌ MongoDB connection error:");
    console.error(error.message);   // 🔥 THIS WILL SHOW REAL PROBLEM
    process.exit(1);                // stop server
  }
};

module.exports = connectDatabase;
