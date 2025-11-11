// auth.js
import fs from 'fs';
import http from 'http';
import url from 'url';
import path from 'path';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

async function run() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ credentials.json missing in project root');
    process.exit(1);
  }

  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const clientInfo = creds.installed || creds.web;

  if (!clientInfo) {
    throw new Error('❌ credentials.json must contain "installed" or "web" (OAuth client).');
  }

  const redirectUri =
    clientInfo.redirect_uris && clientInfo.redirect_uris[0]
      ? clientInfo.redirect_uris[0]
      : 'http://localhost:3000/oauth2callback';

  const oAuth2Client = new google.auth.OAuth2(
    clientInfo.client_id,
    clientInfo.client_secret,
    redirectUri
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify'],
    prompt: 'consent',
  });

  console.log('\n📌 Open this URL in your browser and authorize the app:\n');
  console.log(authUrl, '\n');

  // Start a small local server to capture the OAuth2 callback
  const server = http
    .createServer(async (req, res) => {
      const q = url.parse(req.url, true).query;
      if (q && q.code) {
        res.end('✅ Authorization successful! You can close this tab.');
        server.close();
        try {
          const { tokens } = await oAuth2Client.getToken(q.code);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
          console.log('\n✅ token.json created at', TOKEN_PATH);
        } catch (err) {
          console.error('❌ Error retrieving token:', err);
        }
      } else {
        res.end('No code received');
      }
    })
    .listen(3000, () => {
      console.log('🌐 Listening on http://localhost:3000 for OAuth callback...');
    });
}

run().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});