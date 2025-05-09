const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const SECRET_KEY = "supersecret"; // for demo only

let testAccount, transporter;

async function setupMailer() {
  // Create test account
  testAccount = await nodemailer.createTestAccount();

  // Create transporter with Ethereal SMTP
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

app.get("/", (req, res) => {
  res.send(`
    <form action="/send-link" method="post">
      <input type="email" name="email" placeholder="Enter email" required />
      <button type="submit">Send Magic Link</button>
    </form>
  `);
});

app.post("/send-link", async (req, res) => {
  const email = req.body.email;
  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "5m" });
  const magicLink = `http://localhost:3000/authenticate?token=${token}`;

  const mailOptions = {
    from: '"Magic Link Login" <noreply@example.com>',
    to: email,
    subject: "Your Magic Login Link",
    html: `<p>Click below to login:</p><a href="${magicLink}">${magicLink}</a>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent! Preview at:", nodemailer.getTestMessageUrl(info));
    res.send("✅ Check the console for the magic login link preview URL.");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to send email.");
  }
});

app.get("/authenticate", (req, res) => {
  const token = req.query.token;
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    res.send(`<h2>✅ Logged in as ${payload.email}</h2>`);
  } catch (err) {
    res.status(401).send("❌ Invalid or expired link");
  }
});

setupMailer().then(() => {
  app.listen(3000, () => console.log("📨 Server running at http://localhost:3000"));
});
