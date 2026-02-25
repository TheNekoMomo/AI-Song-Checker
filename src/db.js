const mongoose = require("mongoose");

async function connectDB(mongoUri) {
  if (!mongoUri) throw new Error("MONGODB_URI is missing. Check your .env file.");

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    // These options are fine to omit in newer mongoose versions,
    // but leaving them out keeps it simpler.
  });

  console.log("MongoDB connected");
}

module.exports = { connectDB };