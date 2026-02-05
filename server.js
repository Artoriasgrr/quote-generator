//Creating a local server to avoid CORS issues
//run npm install express node-fetch dotenv to install required packages
// run this server using node server.js in another terminal to run the backend server
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

const app = express();
const PORT = 3000;
dotenv.config();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/quote", async (req, res) => {
    const response = await fetch("https://api.api-ninjas.com/v1/quotes", {
        headers: {
            "X-Api-Key": process.env.API_NINJAS_KEY},
    });
    const data = await response.json();
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
