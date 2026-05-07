import dotenv from "dotenv";
dotenv.config(); // MUST BE FIRST

const {default : app} = await import ("./index.js");
const {default: connectDB } = await import("./src/db/connectDB.js");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();