import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.log("Error en la conexion a MongoDB", error);
    process.exit(1);
  }
};

const getDB = () => {
  return mongoose.connection;
};

mongoose.connection.on("connected", () => {
  console.log("Moongose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.log("Error en la conexion a MongoDB", err);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB disconnected");
  process.exit(0);
});

export { connectDB, getDB };
