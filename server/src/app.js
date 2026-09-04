const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const listRoutes = require("./routes/listRoutes");
const boardRoutes = require("./routes/boardRoutes");
const cardRoutes = require("./routes/cardRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/cards", cardRoutes);

// Test Route
app.get("/", (req, res) => {
    res.send("Task Manager Backend is Running...");
});

module.exports = app;