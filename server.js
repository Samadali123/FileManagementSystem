require("dotenv").config(); // Load environment variables
const express = require("express");
const connectDB = require("./configs/db");
const morgan = require("morgan");

const app = express();

// Connect to MongoDB
connectDB();


// Middleware
app.use(morgan("dev"));
app.use(express.json()); // Ensures JSON request bodies are parsed
app.use(express.urlencoded({extended: false})); //}))


// Routes
require("./routes/file.routes")(app);


// Handle Undefined Routes
app.all("*", (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
