import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Twilio Proxy Endpoint
  app.post("/api/send-alert", async (req, res) => {
    const { location, contactNumber } = req.body;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const toPhone = contactNumber || process.env.EMERGENCY_CONTACT_NUMBER;

    console.log("AIGES Trigger Activated");
    console.log("Sending Emergency Alert...");

    // Check if Twilio is configured
    if (!accountSid || !authToken || !fromPhone || !toPhone) {
      console.log("Demo Mode: Twilio not configured. Logging details instead.");
      console.log(`Alert Details:
        Message: 🚨 AIGES ALERT! Immediate help needed.
        Location: ${location}
        Contact: ${toPhone}
        Time: ${new Date().toLocaleString()}
      `);
      return res.json({ 
        success: true, 
        message: "Demo Mode: Alert logged to console (Twilio not configured)",
        details: { location, toPhone }
      });
    }

    try {
      const client = twilio(accountSid, authToken);
      const message = await client.messages.create({
        body: `🚨 AIGES ALERT! Immediate help needed. Location: ${location} Time: ${new Date().toLocaleString()}`,
        from: fromPhone,
        to: toPhone,
      });

      console.log("SMS Sent Successfully:", message.sid);
      res.json({ success: true, message: "Emergency alert sent successfully." });
    } catch (error) {
      console.error("Failed to send SMS:", error);
      res.status(500).json({ success: false, error: "Failed to send emergency alert." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
