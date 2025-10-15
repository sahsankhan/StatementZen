# MCP Server Integration

- Run manually: `npm run mcp`
- Cursor auto-start: configured in `.cursor/mcp.json` to launch `cypress-mcp.js` via stdio.

## Available Tools
- hello: quick connectivity check
- run-tests: run Cypress in headless Chrome
- open-tests: open Cypress UI
- generate-report: generate Mochawesome report
- run-smoke-tests: run tests tagged `@smoke`

## Using in Cursor
- Open the MCP tools panel, select server `cypress-bdd-pom`, call a tool.

## Note on HTTP vs stdio
- `cypress.config.js` defines tasks (`generateMcpTest`, `executeMcpTest`, `analyzeMcpResults`) that POST to `http://localhost:3000/mcp`.
- The provided MCP server (`cypress-mcp.js`) runs via stdio (no HTTP listener). If you need HTTP, add a small HTTP bridge that forwards JSON RPC `tools/call` to the MCP stdio server, or remove those tasks.
