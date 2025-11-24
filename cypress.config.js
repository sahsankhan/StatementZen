// require('dotenv').config();
// const { defineConfig } = require("cypress");
// const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
// const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
// const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");
// // const { WebClient } = require("@slack/web-api"); // 🔒 Slack commented
// const { execSync } = require("child_process");
// const allureWriter = require('@shelex/cypress-allure-plugin/writer');
// const { getLatestOtp } = require("./gmail");
// const { getOtp } = require("./gmailOtp");


// module.exports = defineConfig({

//   e2e: {
//     specPattern: "cypress/e2e/**/*.feature",
//     async setupNodeEvents(on, config) {
//       await addCucumberPreprocessorPlugin(on, config);
//       on("file:preprocessor", createBundler({
//         plugins: [createEsbuildPlugin(config)],
//       }));


//       allureWriter(on, config);

//       on("task", {
//     async getOtpFromGmail() {
//     return await getLatestOtp({ timeout: 60000 }); // 20s wait
//   },

//   //  async getOtpFromGmail() {
//   //   return await getOtp({ timeout: 20000 });
//   // },


//         logAllure(message) {
//           console.log("Allure Task Log:", message);
//           return null;
//         },
//         allureResultsGenerated() {
//           console.log("Allure results generated in:", process.cwd() + '/allure-results');
//           try {
//             const files = require('fs').readdirSync('allure-results');
//             console.log("Allure files:", files);
//           } catch (error) {
//             console.error("Error reading allure-results directory:", error);
//           }
//           return null;
//         },
//       });

//       // 🔒 Slack notification block commented
//       /*
//       const slackToken = process.env.SLACK_BOT_TOKEN;
//       const slackUserId = process.env.SLACK_USER_ID;
//       if (slackToken && slackUserId) {
//         const slackClient = new WebClient(slackToken);
//         on("after:run", async (results) => {
//           console.log("Test Run Completed. Writing Allure Results...");
//           if (results.totalFailed > 0) {
//             console.log(`Tests failed: ${results.totalFailed}`);
//           } else {
//             console.log("No test failures, generating Allure report...");
//           }

//           if (results.totalFailed > 0) {
//             const message = {
//               channel: slackUserId,
//               text: `:x: *Cypress Test Failure Alert* :x:\n` +
//                     `Environment: ${config.env.baseUrl}\n` +
//                     `Total Tests: ${results.totalTests}\n` +
//                     `Passed: ${results.totalPassed}\n` +
//                     `Failed: ${results.totalFailed}\n` +
//                     `Run Time: ${new Date(results.endedAt).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}\n` +
//                     `Check test results for details.`,
//             };
//             try {
//               await slackClient.chat.postMessage(message);
//               console.log("Slack DM sent successfully to Automationtesting.");
//             } catch (error) {
//               console.error("Failed to send Slack DM:", error);
//             }
//           } else {
//             console.log("No test failures, skipping Slack notification.");
//           }

//           // Generate Allure report
//           try {
//             console.log("Running allure:generate...");
//             execSync('npm run allure:generate', { stdio: 'inherit' });
//             if (!process.env.CI) {
//               console.log("Running allure:open...");
//               execSync('npm run allure:open', { stdio: 'inherit' });
//             } else {
//               console.log("Skipping allure:open in CI environment.");
//             }
//           } catch (error) {
//             console.error("Error generating or opening Allure report:", error);
//           }
//         });
//       } else {
//         console.log("Skipping Slack notification: SLACK_BOT_TOKEN or SLACK_USER_ID missing.");
//       }
//       */

//       return config;
//     },
//     env: {
//       baseUrl: process.env.CYPRESS_baseUrl || "https://dev-app.filmd.co.uk/",
//       validEmail: process.env.CYPRESS_validEmail || "zubair.a@yetiinc.com",
//       validPassword: process.env.CYPRESS_validPassword || "Vista123+",
//       // slackBotToken: process.env.SLACK_BOT_TOKEN, // 🔒 commented
//       // slackUserId: process.env.SLACK_USER_ID,     // 🔒 commented
//       allureResultsPath: "allure-results",
//       allure: true,
//       allureAddVideoOnPass: false,
//     },
//   },
// });


import 'dotenv/config';
import { defineConfig } from "cypress";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";
import allureWriter from '@shelex/cypress-allure-plugin/writer';
import { getLatestOtp } from "./gmail.js";
import { sendSlackNotification } from "./slack-webhook.js";

export default defineConfig({
  e2e: {
    specPattern: "cypress/e2e/**/*.{feature,cy.js}",
    chromeWebSecurity: false, // Disable web security to allow cross-origin requests and suppress script errors
    modifyObstructiveCode: false, // Don't modify obstructive code
    experimentalModifyObstructiveThirdPartyCode: true, // Handle third-party script errors
    numTestsKeptInMemory: 0, // Prevent memory leaks by not keeping tests in memory
    viewportWidth: 1920, // Set realistic viewport
    viewportHeight: 1080,
    defaultCommandTimeout: 15000, // Increase default timeout
    pageLoadTimeout: 60000, // Increase page load timeout
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on("file:preprocessor", createBundler({
        plugins: [createEsbuildPlugin(config)],
      }));
      
      // Configure Allure with screenshot support
      allureWriter(on, config);
      
      // Ensure screenshots are attached to Allure reports
      on('after:screenshot', (details) => {
        console.log('Screenshot captured for Allure:', details.path);
        return details;
      });

      // Configure browser launch arguments for ADVANCED stealth mode
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' || browser.name === 'electron') {
          console.log('🛡️ Configuring ADVANCED stealth browser arguments...');
          
          // User agent to appear as a real browser
          launchOptions.args.push('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          
          // Primary automation detection bypass
          launchOptions.args.push('--disable-blink-features=AutomationControlled');
          
          // Remove automation indicators
          launchOptions.args.push('--exclude-switches=enable-automation');
          launchOptions.args.push('--disable-automation');
          
          // Security and sandbox settings
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-setuid-sandbox');
          launchOptions.args.push('--disable-web-security');
          launchOptions.args.push('--disable-features=IsolateOrigins,site-per-process');
          
          // Additional stealth flags
          launchOptions.args.push('--disable-infobars');
          launchOptions.args.push('--disable-notifications');
          launchOptions.args.push('--disable-popup-blocking');
          launchOptions.args.push('--disable-save-password-bubble');
          launchOptions.args.push('--disable-translate');
          launchOptions.args.push('--disable-background-timer-throttling');
          launchOptions.args.push('--disable-backgrounding-occluded-windows');
          launchOptions.args.push('--disable-breakpad');
          launchOptions.args.push('--disable-component-extensions-with-background-pages');
          launchOptions.args.push('--disable-extensions');
          launchOptions.args.push('--disable-features=TranslateUI');
          launchOptions.args.push('--disable-hang-monitor');
          launchOptions.args.push('--disable-ipc-flooding-protection');
          launchOptions.args.push('--disable-prompt-on-repost');
          launchOptions.args.push('--disable-renderer-backgrounding');
          launchOptions.args.push('--disable-sync');
          launchOptions.args.push('--metrics-recording-only');
          launchOptions.args.push('--no-first-run');
          launchOptions.args.push('--safebrowsing-disable-auto-update');
          launchOptions.args.push('--enable-features=NetworkService,NetworkServiceInProcess');
          launchOptions.args.push('--disable-features=site-per-process');
          launchOptions.args.push('--disable-features=VizDisplayCompositor');
          
          // Performance and compatibility
          launchOptions.args.push('--ignore-certificate-errors');
          launchOptions.args.push('--ignore-ssl-errors');
          launchOptions.args.push('--allow-running-insecure-content');
          
          // Set window size and position for consistency
          launchOptions.args.push('--window-size=1920,1080');
          launchOptions.args.push('--start-maximized');
          
          // GPU acceleration settings
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--disable-software-rasterizer');
          
          console.log('✅ Advanced stealth browser configuration applied');
          console.log(`📋 Total args: ${launchOptions.args.length}`);
        }
        return launchOptions;
      });

      on("task", {
        async getOtpFromGmail() {
          return await getLatestOtp({ timeout: 60000 });
        },
        log(message) {
          console.log(message);
          return null;
        },
        logAllure(message) {
          console.log("Allure Task Log:", message);
          return null;
        },
        async allureResultsGenerated() {
          console.log("Allure results generated in:", process.cwd() + '/allure-results');
          try {
            const fs = await import('fs');
            const files = fs.readdirSync('allure-results');
            console.log("Allure files:", files);
          } catch (error) {
            console.error("Error reading allure-results directory:", error);
          }
          return null;
        },
        // New MCP tasks
        async generateMcpTest({ url, prompt }) {
          const response = await fetch('http://localhost:3000/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'tools/call',
              params: {
                name: 'generate_test_suite',
                arguments: { url, prompt }
              }
            })
          });
          const result = await response.json();
          console.log('MCP Test Generation Result:', result);
          return result;
        },
        async executeMcpTest({ spec, headless = true }) {
          const response = await fetch('http://localhost:3000/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'tools/call',
              params: {
                name: 'execute_test',
                arguments: { spec, headless }
              }
            })
          });
          const result = await response.json();
          console.log('MCP Test Execution Result:', result);
          return result;
        },
        async analyzeMcpResults({ results }) {
          const response = await fetch('http://localhost:3000/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'tools/call',
              params: {
                name: 'analyze_results',
                arguments: { results }
              }
            })
          });
          const result = await response.json();
          console.log('MCP Results Analysis:', result);
          return result;
        }
      });

      // Clean old Allure results before test run to ensure fresh reports
      on("before:run", async (details) => {
        if (!config.env.allure) {
          return;
        }

        console.log("\n========================================");
        console.log("🧹 Cleaning old Allure results...");
        console.log("========================================\n");

        try {
          const fs = await import('fs');
          const path = await import('path');
          const { fileURLToPath } = await import('url');
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          
          const allureResultsDir = path.join(__dirname, 'allure-results');
          const allureReportDir = path.join(__dirname, 'allure-report');
          
          // Clean allure-results directory
          if (fs.existsSync(allureResultsDir)) {
            const files = fs.readdirSync(allureResultsDir);
            for (const file of files) {
              fs.unlinkSync(path.join(allureResultsDir, file));
            }
            console.log("✅ Cleaned allure-results directory");
          }
          
          // Clean allure-report directory
          if (fs.existsSync(allureReportDir)) {
            fs.rmSync(allureReportDir, { recursive: true, force: true });
            console.log("✅ Cleaned allure-report directory");
          }
          
          console.log("✅ Ready for fresh test results!\n");
          
        } catch (error) {
          console.error("⚠️ Error cleaning Allure directories:", error.message);
        }
      });

      // Automatically generate and open Allure report after test run
      on("after:run", async (results) => {
        console.log("\n========================================");
        console.log("Test run completed. Generating Allure report...");
        console.log("========================================\n");
        
        // Check if allure is enabled
        if (!config.env.allure) {
          console.log("Allure reporting is disabled. Skipping report generation.");
          return;
        }

        // Add delay to ensure browser closes cleanly
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          const path = await import('path');
          const { fileURLToPath } = await import('url');
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          
          const reportScript = path.join(__dirname, 'allure-report-generator.bat');
          
          console.log("📊 Generating Allure report...");
          
          // Execute the batch file with increased timeout
          const { stdout, stderr } = await execAsync(`"${reportScript}"`, {
            cwd: __dirname,
            windowsHide: false,
            timeout: 60000, // 60 second timeout
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
          });
          
          if (stdout) {
            console.log(stdout);
          }
          if (stderr && !stderr.includes('Report successfully generated')) {
            console.error(stderr);
          }
          
          console.log("\n✅ Allure report generated and opened successfully!");
          console.log("🌐 Report available at: http://localhost:4040");
          console.log("📁 Report location:", path.join(__dirname, 'allure-report', 'index.html'));
          console.log("\n========================================\n");
          
        } catch (error) {
          console.error("\n❌ Error generating Allure report:", error.message);
          console.error("📝 Results saved to: allure-results/");
          console.error("🔧 You can manually generate the report by running:");
          console.error("   cmd /c allure-report-generator.bat");
          console.error("\n========================================\n");
        }

        // Send Slack notification
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (webhookUrl) {
          await sendSlackNotification(results, webhookUrl);
        }
      });

      return config;
    },
    env: {
      baseUrl: process.env.CYPRESS_baseUrl || "https://dev-app.filmd.co.uk/",
      validEmail: process.env.CYPRESS_validEmail || "zubair.a@yetiinc.com",
      validPassword: process.env.CYPRESS_validPassword || "Vista123+",
      allure: true,
      allureResultsPath: "allure-results",
      allureAddVideoOnPass: false,
      allureAttachRequests: false,
      allureLogCyCommands: true,
      allureSkipCommands: "wrap",
      allureLogGherkin: true,
      allureAttachScreenshots: true,
    },
    screenshotOnRunFailure: true,
    screenshotsFolder: "cypress/screenshots",
    trashAssetsBeforeRuns: false,
  },
});