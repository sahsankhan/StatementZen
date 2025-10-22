# MCP Server Integration

- Run manually: `npm run mcp`
- Cursor auto-start: configured in `.cursor/mcp.json` to launch `cypress-mcp.js` via stdio.

## Available Tools

### 🎯 BDD Automation Tools
- **automate-feature**: Automatically execute feature files without step definitions (with auto Allure reporting)
- **parse-feature-steps**: Parse BDD steps and generate automation scripts (with optional execution and reporting)
- **generate-step-definitions**: Generate step definitions from feature files
- **generate-page-object**: Create page object class files
- **scaffold-from-feature**: Generate both page object and step definitions from feature file

### 📊 Allure Reporting Tools (NEW!)
- **generate-allure-report**: Generate Allure HTML report from test results
- **clean-allure-reports**: Clean all Allure report files and directories
- **run-tests-with-report**: Run Cypress tests with automatic report generation and opening

### ✨ Key Features
- ✅ **Automatic Report Generation** - Reports auto-generate after test execution
- ✅ **Auto-Open in Browser** - Reports automatically open in default browser
- ✅ **Non-blocking Execution** - Report server runs in background
- ✅ **Support for All Test Outcomes** - Reports generated for both passed and failed tests

## Using in Cursor
- Open the MCP tools panel, select server `cypress-bdd-pom`, call a tool.
- All test execution tools now automatically generate and open Allure reports!

## Quick Start Examples

### Run Feature File with Automatic Reporting
```javascript
// Auto-selects test.feature, runs tests, generates & opens report
automate-feature()

// Specific feature file
automate-feature({ featurePath: "cypress/e2e/features/login.feature" })

// Headless mode
automate-feature({ headless: true })
```

### Parse and Execute with Reporting
```javascript
// Parse steps and run with custom base URL
parse-feature-steps({ 
  runAutomation: true, 
  baseUrl: "https://dev-app.filmd.co.uk/" 
})
```

### Generate Report Only
```javascript
// Generate and open report from existing results
generate-allure-report({ openReport: true })
```

### Clean Reports
```javascript
// Clean old reports before new run
clean-allure-reports()
```

## Report Features
- 📈 Test execution timeline
- 📝 Detailed test case breakdown
- 🎯 Step-by-step execution logs
- 📸 Screenshots on failures
- 📊 Statistics and graphs
- 🌐 Interactive web interface

## NPM Scripts
```bash
npm test                  # Run all tests with Allure
npm run allure:generate   # Generate report from results
npm run allure:open       # Open existing report
npm run allure:clean      # Clean all reports
```

## Documentation
- See `ALLURE_MCP_INTEGRATION.md` for detailed Allure integration guide
- Report files stored in: `allure-results/` and `allure-report/`
- Reports open on port 4040 by default

## Note on HTTP vs stdio
- `cypress.config.js` defines tasks (`generateMcpTest`, `executeMcpTest`, `analyzeMcpResults`) that POST to `http://localhost:3000/mcp`.
- The provided MCP server (`cypress-mcp.js`) runs via stdio (no HTTP listener). If you need HTTP, add a small HTTP bridge that forwards JSON RPC `tools/call` to the MCP stdio server, or remove those tasks.
