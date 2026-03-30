import mongoose from "mongoose";

// Let the hosting platform decide DNS servers. Hard-coding public resolvers
// (e.g., 1.1.1.1 / 8.8.8.8) caused SRV lookups to fail with `querySrv
// ECONNREFUSED` on some networks. If you need custom DNS locally, set it
// outside the app instead of forcing it here.

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DBNAME || "messmate",
      serverSelectionTimeoutMS: 10000,
      // Keep default buffering so handlers don't throw while the initial
      // connection is in flight; operations will queue briefly instead.
      bufferCommands: true,
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
