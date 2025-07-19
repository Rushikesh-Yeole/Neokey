import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'Neokey',
      maxPoolSize: 200,
      minPoolSize: 0,
      waitQueueTimeoutMS: 3000,     // Fail fast if pool full
      socketTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000, // Check connection health every 10s
      autoIndex: false, // Disable automatic index creation in production
    });
    console.log("Database connected with connection pooling");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;