const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const SECRET_KEY = "supersecret"; // Use env variable in real apps

// Step 1: Render the login form
app.get("/", (req, res) => {
  res.send(`
    <form action="/send-link" method="post">
      <input type="email" name="email" placeholder="Enter email" required/>
      <button type="submit">Send Magic Link</button>
    </form>
  `);
});

// Step 2: Generate magic link
app.post("/send-link", (req, res) => {
  const email = req.body.email;
  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "5m" }); // expires in 5 minutes
  const link = `http://localhost:3000/authenticate?token=${token}`;

  console.log(`💌 Magic Link (simulated email): ${link}`);
  res.send("Check your 'email' (terminal) for a magic login link.");
});

// Step 3: Authenticate with token
app.get("/authenticate", (req, res) => {
  const token = req.query.token;
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    res.send(`<h2>✅ Logged in as ${payload.email}</h2>`);
  } catch (err) {
    res.status(401).send("❌ Invalid or expired link");
  }
});

app.listen(3000, () => console.log("🔒 Server running at http://localhost:3000"));
