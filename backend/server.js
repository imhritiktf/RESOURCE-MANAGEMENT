require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

connectDB();
require("./utils/cronJobs");
require("./utils/slaCron");   // Handles SLA breach tracking



// routes
app.get("/", (req, res) => {
    res.send("api is running, hritik iw watching you");
});
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));

// server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`server is running on port ${PORT}`);
});
