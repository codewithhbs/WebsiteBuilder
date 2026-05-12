const mongoose = require("mongoose");
const ENV = require("./env");

const connectDB = async () => {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(ENV.MONGODB_URL);
    console.log("[db] connected:", mongoose.connection.name);
  } catch (err) {
    console.error("[db] connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
