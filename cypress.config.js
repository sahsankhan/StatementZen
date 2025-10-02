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


require('dotenv').config();
const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");
const allureWriter = require('@shelex/cypress-allure-plugin/writer');
const { getLatestOtp } = require("./gmail");

module.exports = defineConfig({
  e2e: {
    specPattern: "cypress/e2e/**/*.feature",
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on("file:preprocessor", createBundler({
        plugins: [createEsbuildPlugin(config)],
      }));
      allureWriter(on, config);

      on("task", {
        async getOtpFromGmail() {
          return await getLatestOtp({ timeout: 60000 });
        },
        logAllure(message) {
          console.log("Allure Task Log:", message);
          return null;
        },
        allureResultsGenerated() {
          console.log("Allure results generated in:", process.cwd() + '/allure-results');
          try {
            const files = require('fs').readdirSync('allure-results');
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

      return config;
    },
    env: {
      baseUrl: process.env.CYPRESS_baseUrl || "https://dev-app.filmd.co.uk/",
      validEmail: process.env.CYPRESS_validEmail || "zubair.a@yetiinc.com",
      validPassword: process.env.CYPRESS_validPassword || "Vista123+",
      allure: true,
      allureAddVideoOnPass: false,
    },
  },
});