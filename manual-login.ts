import { chromium } from '@playwright/test';
import readline from 'node:readline';

const QUICKBOOKS_LOGIN_URL =
  process.env.QUICKBOOKS_LOGIN_URL ??
  'https://accounts.intuit.com/app/sign-in?app_name=qbo&locale=en_US';
const STORAGE_STATE_PATH = process.env.AUTH_STATE_PATH ?? 'auth.json';

const promptUser = (question: string) =>
  new Promise<void>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, () => {
      rl.close();
      resolve();
    });
  });

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(
    '\n➡ Opening QuickBooks so you can sign in and complete the OTP flow...'
  );
  await page.goto(QUICKBOOKS_LOGIN_URL, { waitUntil: 'load' });

  console.log(
    '\n⏳ Finish the login (including OTP) in the browser window.\n   When you land on the QuickBooks home page, return here and hit Enter.'
  );
  await promptUser('\nPress Enter once you are fully logged in: ');

  await context.storageState({ path: STORAGE_STATE_PATH });
  console.log(`\n✔ Session saved to ${STORAGE_STATE_PATH}`);

  await browser.close();
  console.log('\n✅ All done! You can now run Playwright tests without logging in.');
})().catch((error) => {
  console.error('Manual login helper failed:', error);
  process.exitCode = 1;
});

