// import mongoose from "mongoose";

// const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/MessManagement";
// let cached = global.mongoose  || { conn: null, promise: null };

// export async function connectDB() {
//   if (cached.conn) return cached.conn;

//   if (!cached.promise) {
//     cached.promise = mongoose.connect(MONGODB_URI, {
//       dbName: "MessManagement",
//       bufferCommands: false,
//     }).then((mongoose) => {
//       console.log("✅ MongoDB connected successfully");
//       return mongoose;
//     }).catch((err) => {
//       console.error("❌ MongoDB connection error:", err);
//       throw err;
//     });
//   }

//   cached.conn = await cached.promise;
//   global.mongoose = cached;
//   return cached.conn;
// }


import mongoose from "mongoose";
const MONGODB_URI = process.env.MONGODB_URI;
let isConnected = false; 
export async function connectDB() {
  if (isConnected) {
    console.log("✅ MongoDB already connected");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "messmate",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log("MongoDB Connected:", conn.connection.host);
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
}

