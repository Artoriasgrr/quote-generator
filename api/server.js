// api/server.js
const express = require("express");
const cors = require("cors");
const app = express();
const quotes = require("./quotes");

app.use(cors());
app.use(express.json());

// Get all quotes
app.get("/quotes", (req, res) => {
  res.json(quotes);
});

// Get a random quote
app.get("/quotes/random", (req, res) => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  res.json(quotes[randomIndex]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Quotes API running on port ${PORT}`));
