require("dotenv").config({ path: ".env" });
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const cookieparser = require("cookie-parser");
const path = require("path");

app.use(cors());
app.use(cookieparser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, "public")));
app.use("/storage", express.static(path.join(__dirname, "storage")));

const Route = require("./route/index.route");
app.use("/", Route);

mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGO_URL, {})
  .then(() => {
    console.log("[INFO] Connected to MongoDB");
  })
  .catch((error) => {
    console.error("[ERROR] MongoDB connection error:", error);
  });

app.listen(PORT, () => {
  pingTimeout = setTimeout(() => {}, 30000);
  console.log(`[INFO] Server started on port : ${PORT}`);
});


module.exports = app;