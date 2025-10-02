// // gmail.js
// const fs = require('fs');
// const path = require('path');
// const { google } = require('googleapis');
// const { convert } = require('html-to-text');

// const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
// const TOKEN_PATH = path.join(__dirname, 'token.json');

// function base64UrlDecode(str) {
//   if (!str) return '';
//   str = str.replace(/-/g, '+').replace(/_/g, '/');
//   while (str.length % 4) str += '=';
//   return Buffer.from(str, 'base64').toString('utf8');
// }

// function extractBodyFromPayload(payload) {
//   if (!payload) {
//     console.log('No payload provided');
//     return '';
//   }
//   if (payload.body && payload.body.data) {
//     const body = base64UrlDecode(payload.body.data);
//     console.log('Extracted body:', body);
//     return body;
//   }
//   if (payload.parts) {
//     for (const part of payload.parts) {
//       if (part.mimeType === 'text/plain' && part.body && part.body.data) {
//         const body = base64UrlDecode(part.body.data);
//         console.log('Extracted text/plain body:', body);
//         return body;
//       }
//       if (part.mimeType === 'text/html' && part.body && part.body.data) {
//         const htmlBody = base64UrlDecode(part.body.data);
//         console.log('Extracted text/html body:', htmlBody);
//         const plainText = convert(htmlBody, {
//           wordwrap: false,
//           selectors: [
//             { selector: 'a', options: { ignoreHref: true } },
//             { selector: 'img', format: 'skip' },
//           ],
//         });
//         console.log('Converted plain text:', plainText);
//         return plainText;
//       }
//     }
//   }
//   console.log('No valid body found in payload');
//   return '';
// }

// async function getAuthClient() {
//   if (!fs.existsSync(CREDENTIALS_PATH)) throw new Error('credentials.json not found in project root');

//   const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
//   const clientInfo = creds.installed || creds.web;

//   if (!clientInfo) throw new Error('Unsupported credentials.json format (needs "installed" or "web")');

//   const oAuth2Client = new google.auth.OAuth2(
//     clientInfo.client_id,
//     clientInfo.client_secret,
//     clientInfo.redirect_uris ? clientInfo.redirect_uris[0] : 'http://localhost:3000/oauth2callback'
//   );

//   if (!fs.existsSync(TOKEN_PATH)) {
//     throw new Error('token.json not found — run `node auth.js` to create it.');
//   }

//   const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
//   oAuth2Client.setCredentials(token);
//   return oAuth2Client;
// }

// const fetchedMessageIds = new Set();

// async function getLatestOtp({ query, timeout = 120000, pollInterval = 5000, digits = 6 } = {}) {
//   fetchedMessageIds.clear(); // Reset to avoid stale IDs
//   const twoMinutesAgo = Math.floor((Date.now() - 2 * 60 * 1000) / 1000);
//   query = query || `from:support@statementzen.com subject:"One-Time Password" OR subject:"One-Time Code" after:${twoMinutesAgo}`;
//   const auth = await getAuthClient();
//   const gmail = google.gmail({ version: 'v1', auth });

//   const deadline = Date.now() + timeout;
//   console.log(`🔍 Searching Gmail for OTP (query="${query}") for up to ${Math.round(timeout/1000)}s ...`);

//   while (Date.now() < deadline) {
//     try {
//       const listRes = await gmail.users.messages.list({
//         userId: 'me',
//         q: query,
//         maxResults: 10,
//       });

//       const messages = listRes.data.messages || [];

//       if (messages.length === 0) {
//         console.log('No messages found, retrying...');
//         await new Promise(r => setTimeout(r, pollInterval));
//         continue;
//       }

//       const detailedMessages = await Promise.all(
//         messages.map(async (m) => {
//           const msgRes = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
//           console.log(`Fetched email ID: ${m.id}, Date: ${new Date(Number(msgRes.data.internalDate)).toISOString()}`);
//           return { ...msgRes.data, id: m.id, internalDate: Number(msgRes.data.internalDate) };
//         })
//       );

//       detailedMessages.sort((a, b) => b.internalDate - a.internalDate);
//       console.log('Sorted email IDs:', detailedMessages.map(m => ({ id: m.id, date: new Date(m.internalDate).toISOString() })));

//       for (const m of detailedMessages) {
//         console.log(`Processing email ID: ${m.id}, Date: ${new Date(Number(m.internalDate)).toISOString()}`);
//         if (fetchedMessageIds.has(m.id)) {
//           console.log(`Skipping already processed email ID: ${m.id}`);
//           continue;
//         }

//         const body = extractBodyFromPayload(m.payload) + ' ' + (m.snippet || '');
//         // Try plain text regex first
//         let found = body.match(/Use the One-Time Password \(OTP\) below to complete your login:\s*(\d{6})/i);
//         if (!found) {
//           // Fallback to HTML regex if plain text fails
//           found = body.match(/<div style="font-family:Poppins, sans-serif;font-size:32px;font-weight:600;letter-spacing:3px;line-height:32px;text-align:center;color:#005375;">(\d{6})<\/div>/);
//         }
//         if (found) {
//           console.log('Regex match found:', found);
//           fetchedMessageIds.add(m.id);

//           await gmail.users.messages.modify({
//             userId: 'me',
//             id: m.id,
//             resource: { removeLabelIds: ['UNREAD'] },
//           });

//           console.log('🔑 OTP fetched:', found[1]);
//           return found[1];
//         } else {
//           console.log('No OTP found in body:', body);
//         }
//       }
//     } catch (err) {
//       console.error('Gmail fetch error:', err.message || err);
//     }

//     await new Promise(r => setTimeout(r, pollInterval));
//   }

//   throw new Error('OTP not found within timeout');
// }

// module.exports = { getLatestOtp };

require('dotenv').config();
const { google } = require('googleapis');
const { convert } = require('html-to-text');

function base64UrlDecode(str) {
  if (!str) return '';
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function extractBodyFromPayload(payload) {
  if (!payload) {
    console.log('No payload provided');
    return '';
  }
  if (payload.body && payload.body.data) {
    const body = base64UrlDecode(payload.body.data);
    console.log('Extracted body:', body);
    return body;
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        const body = base64UrlDecode(part.body.data);
        console.log('Extracted text/plain body:', body);
        return body;
      }
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        const htmlBody = base64UrlDecode(part.body.data);
        console.log('Extracted text/html body:', htmlBody);
        const plainText = convert(htmlBody, {
          wordwrap: false,
          selectors: [
            { selector: 'a', options: { ignoreHref: true } },
            { selector: 'img', format: 'skip' },
          ],
        });
        console.log('Converted plain text:', plainText);
        return plainText;
      }
    }
  }
  console.log('No valid body found in payload');
  return '';
}

async function getAuthClient() {
  // Load credentials from environment variables
  if (!process.env.GMAIL_CREDENTIALS) {
    throw new Error('GMAIL_CREDENTIALS environment variable not set');
  }
  if (!process.env.GMAIL_TOKEN) {
    throw new Error('GMAIL_TOKEN environment variable not set');
  }

  const credentials = JSON.parse(process.env.GMAIL_CREDENTIALS);
  const clientInfo = credentials.installed || credentials.web;
  if (!clientInfo) {
    throw new Error('Unsupported GMAIL_CREDENTIALS format (needs "installed" or "web")');
  }

  const oAuth2Client = new google.auth.OAuth2(
    clientInfo.client_id,
    clientInfo.client_secret,
    clientInfo.redirect_uris ? clientInfo.redirect_uris[0] : 'http://localhost:3000/oauth2callback'
  );

  const token = JSON.parse(process.env.GMAIL_TOKEN);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

const fetchedMessageIds = new Set();

async function getLatestOtp({ query, timeout = 120000, pollInterval = 5000, digits = 6 } = {}) {
  fetchedMessageIds.clear();
  const oneMinuteAgo = Math.floor((Date.now() - 1 * 60 * 1000) / 1000);
  query = query || `from:support@statementzen.com subject:"One-Time Password" OR subject:"One-Time Code" after:${oneMinuteAgo}`;
  const auth = await getAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const deadline = Date.now() + timeout;
  console.log(`🔍 Searching Gmail for OTP (query="${query}") for up to ${Math.round(timeout/1000)}s ...`);

  while (Date.now() < deadline) {
    try {
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 10,
      });

      const messages = listRes.data.messages || [];

      if (messages.length === 0) {
        console.log('No messages found, retrying...');
        await new Promise(r => setTimeout(r, pollInterval));
        continue;
      }

      const detailedMessages = await Promise.all(
        messages.map(async (m) => {
          const msgRes = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
          console.log(`Fetched email ID: ${m.id}, Date: ${new Date(Number(msgRes.data.internalDate)).toISOString()}`);
          return { ...msgRes.data, id: m.id, internalDate: Number(msgRes.data.internalDate) };
        })
      );

      detailedMessages.sort((a, b) => b.internalDate - a.internalDate);
      console.log('Sorted email IDs:', detailedMessages.map(m => ({ id: m.id, date: new Date(m.internalDate).toISOString() })));

      for (const m of detailedMessages) {
        console.log(`Processing email ID: ${m.id}, Date: ${new Date(Number(m.internalDate)).toISOString()}`);
        if (fetchedMessageIds.has(m.id)) {
          console.log(`Skipping already processed email ID: ${m.id}`);
          continue;
        }

        const body = extractBodyFromPayload(m.payload) + ' ' + (m.snippet || '');
        let found = body.match(/Use the One-Time Password \(OTP\) below to complete your login:\s*(\d{6})/i);
        if (!found) {
          found = body.match(/<div style="font-family:Poppins, sans-serif;font-size:32px;font-weight:600;letter-spacing:3px;line-height:32px;text-align:center;color:#005375;">(\d{6})<\/div>/);
        }
        if (found) {
          console.log('Regex match found:', found);
          fetchedMessageIds.add(m.id);

          await gmail.users.messages.modify({
            userId: 'me',
            id: m.id,
            resource: { removeLabelIds: ['UNREAD'] },
          });

          console.log('🔑 OTP fetched:', found[1]);
          return found[1];
        } else {
          console.log('No OTP found in body:', body);
        }
      }
    } catch (err) {
      console.error('Gmail fetch error:', err.message || err);
    }

    await new Promise(r => setTimeout(r, pollInterval));
  }

  throw new Error('OTP not found within timeout');
}

module.exports = { getLatestOtp };