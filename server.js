const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve CSS and HTML

// JWT secret key (demo only — use env var in production)
const SECRET_KEY = "supersecret";

// Database setup
const adapter = new FileSync("db.json");
const db = low(adapter);
db.defaults({ users: [] }).write(); // Initialize if empty

let transporter; // email transporter

// Setup Ethereal mail and DB
async function setup() {
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("📧 Ethereal test account created:");
  console.log("   Preview inbox:", testAccount.user);
  console.log("   Preview password:", testAccount.pass);
}

// Serve HTML form
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle form submission
app.post("/send-link", async (req, res) => {
  const email = req.body.email;

  const user = db.get("users").find({ email }).value();
  if (!user) {
    return res.status(403).send("❌ Email not registered. Access denied.");
  }

  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "5m" });
  const magicLink = `http://localhost:${PORT}/authenticate?token=${token}`;

  const mailOptions = {
    from: '"Magic Login" <noreply@example.com>',
    to: email,
    subject: "Your Magic Login Link",
    html: `<p>Click below to login. This link will expire in 5 minutes:</p>
           <a href="${magicLink}">${magicLink}</a>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Magic link sent. Preview here:");
    console.log(nodemailer.getTestMessageUrl(info));
    res.send("✅ Magic link sent! Check the terminal for your preview URL.");
  } catch (error) {
    console.error("❌ Email send failed:", error);
    res.status(500).send("❌ Failed to send email.");
  }
});

// Authenticate token from link
app.get("/authenticate", (req, res) => {
  const token = req.query.token;

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    res.sendFile(path.join(__dirname, "public", "success.html"));
  } catch (err) {
    res.status(401).send("❌ Invalid or expired login link");
  }
});

// Start server
setup().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
