import mongoose from "mongoose";
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
let isConnected = false; 

export async function connectDB() {
  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }

  try {

    // console.log("Connecting to MongoDB...", process.env.MONGODB_URI);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "messmate",
    });

    isConnected = true;
    console.log("MongoDB Connected:", conn.connection.host);
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
}

