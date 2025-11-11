#!/usr/bin/env node
import { McpClient } from "@modelcontextprotocol/sdk/client";
import { ChildProcessClientTransport } from "@modelcontextprotocol/sdk/client";
import { spawn } from "child_process";

async function main() {
  // Spawn the MCP server process
  const serverProcess = spawn('node', ['cypress-mcp.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  serverProcess.stderr.on('data', (data) => {
    console.log(`Server stderr: ${data}`);
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server stdout: ${data}`);
  });

  // Create a client that connects to the server process
  const transport = new ChildProcessClientTransport(serverProcess);
  const client = new McpClient();
  await client.connect(transport);

  try {
    // Get server info
    const info = await client.getServerInfo();
    console.log("Server info:", info);

    // List available tools
    const tools = await client.listTools();
    console.log("Available tools:", tools);

    // Try to call the parse-and-execute tool
    console.log("Calling parse-and-execute tool...");
    const result = await client.callTool("parse-and-execute", {
      steps: [
        'I visit login page "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login"',
        'I enter username "Admin"',
        'I enter password "admin123"',
        'I click on login button',
        'I should see "Dashboard" heading'
      ]
    });
    
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Disconnect and clean up
    await client.disconnect();
    serverProcess.kill();
  }
}

main().catch(console.error);
