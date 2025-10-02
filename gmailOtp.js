const fs = require("fs");
const { google } = require("googleapis");

const CREDENTIALS_PATH = "credentials.json";
const TOKEN_PATH = "token.json";

async function getOtp() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const clientInfo = creds.installed || creds.web;
  if (!clientInfo) throw new Error('Unsupported credentials.json format');

  const { client_id, client_secret, redirect_uris } = clientInfo;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (!fs.existsSync(TOKEN_PATH)) throw new Error("❌ token.json missing. Run auth.js first.");
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const res = await gmail.users.messages.list({
    userId: "me",
    q: 'is:unread from:support@statementzen.com subject:"One-Time Code" OR subject:"One-Time Password"',
    maxResults: 5
  });

  const messages = res.data.messages || [];
  if (messages.length === 0) throw new Error("❌ No OTP email found");

  for (const msgInfo of messages) {
    const msg = await gmail.users.messages.get({ userId: "me", id: msgInfo.id, format: "full" });

    let emailBody = "";

    const parts = msg.data.payload.parts || [msg.data.payload];
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        emailBody += Buffer.from(part.body.data, "base64").toString("utf8");
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = Buffer.from(part.body.data, "base64").toString("utf8");
        emailBody += html.replace(/<[^>]+>/g, " "); // strip HTML tags
      }
    }

    const match = emailBody.match(/\b\d{6}\b/);
    if (match) {
      // Mark as read
      await gmail.users.messages.modify({
        userId: "me",
        id: msgInfo.id,
        resource: { removeLabelIds: ["UNREAD"] }
      });
      console.log("🔑 OTP fetched:", match[0]);
      return match[0];
    }
  }

  throw new Error("❌ OTP not found in any unread email");
}

module.exports = { getOtp };
