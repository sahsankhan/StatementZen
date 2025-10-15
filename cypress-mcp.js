#!/usr/bin/env node
import { exec } from "child_process";
import { promisify } from "util";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const execAsync = promisify(exec);

// Helper to run shell commands
async function runCommand(cmd) {
  try {
    const { stdout, stderr } = await execAsync(cmd);
    return { content: [{ type: "text", text: stdout || stderr }] };
  } catch (error) {
    return { content: [{ type: "text", text: error.message }] };
  }
}

// Helper functions for BDD automation
function parseFeatureSteps(featureContent) {
  const lines = featureContent.split('\n');
  const steps = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('Given') || trimmed.startsWith('When') || trimmed.startsWith('Then') || trimmed.startsWith('And')) {
      steps.push(trimmed);
    }
  }
  
  return steps;
}

function generateAutomationScript(steps) {
  let script = `describe('Dynamic BDD Automation', () => {
  it('executes BDD steps dynamically', () => {
`;
  
  for (const step of steps) {
    const automationCode = convertStepToAutomation(step);
    script += `    ${automationCode}\n`;
  }
  
  script += `  });
});`;
  
  return script;
}

function generateDirectAutomationScript(steps, baseUrl) {
  let script = `describe('Direct BDD Automation', () => {
  it('executes BDD steps directly', () => {
`;
  
  if (baseUrl) {
    script += `    cy.visit('${baseUrl}');\n`;
  }
  
  for (const step of steps) {
    const automationCode = convertStepToAutomation(step);
    script += `    ${automationCode}\n`;
  }
  
  script += `  });
});`;
  
  return script;
}

function convertStepToAutomation(step) {
  // Visit page
  if (step.includes('visit') && step.includes('"')) {
    const urlMatch = step.match(/"([^"]+)"/);
    if (urlMatch) {
      return `cy.visit('${urlMatch[1]}', { failOnStatusCode: false });`;
    }
  }
  
  // Enter username
  if (step.includes('enter username') && step.includes('"')) {
    const usernameMatch = step.match(/"([^"]+)"/);
    if (usernameMatch) {
      return `cy.get('input[name="username"], input[placeholder*="username"], input[placeholder*="Username"], input[type="email"]').type('${usernameMatch[1]}');`;
    }
  }
  
  // Enter password
  if (step.includes('enter password') && step.includes('"')) {
    const passwordMatch = step.match(/"([^"]+)"/);
    if (passwordMatch) {
      return `cy.get('input[name="password"], input[type="password"]').type('${passwordMatch[1]}');`;
    }
  }
  
  // Click login button
  if (step.includes('click') && step.includes('login button')) {
    return `cy.get('button[type="submit"], button:contains("Login"), button:contains("Sign in"), input[type="submit"], button:contains("Log in")').click();`;
  }
  
  // Should see heading
  if (step.includes('should see') && step.includes('heading') && step.includes('"')) {
    const headingMatch = step.match(/"([^"]+)"/);
    if (headingMatch) {
      return `cy.contains('${headingMatch[1]}', { matchCase: false }).should('be.visible');`;
    }
  }
  
  // Generic click button
  if (step.includes('click') && step.includes('"')) {
    const buttonMatch = step.match(/"([^"]+)"/);
    if (buttonMatch) {
      return `cy.get('button:contains("${buttonMatch[1]}"), input[value*="${buttonMatch[1]}"], a:contains("${buttonMatch[1]}")').click();`;
    }
  }
  
  // Generic should see
  if (step.includes('should see') && step.includes('"')) {
    const textMatch = step.match(/"([^"]+)"/);
    if (textMatch) {
      return `cy.contains('${textMatch[1]}', { matchCase: false }).should('be.visible');`;
    }
  }
  
  // Default fallback
  return `// ${step} - No automation mapping found`;
}

// ✅ Use McpServer and register tools explicitly so capabilities are advertised
const server = new McpServer({ name: "cypress-bdd-pom", version: "1.0.0" });
const registeredTools = [];

registeredTools.push("hello");
server.registerTool(
  "hello",
  { title: "Hello", description: "Simple test tool to confirm MCP works" },
  async () => ({ content: [{ type: "text", text: "👋 Hello from Cypress MCP server!" }] })
);

registeredTools.push("run-tests");
server.registerTool(
  "run-tests",
  { title: "Run Tests", description: "Run Cypress BDD tests in headless Chrome" },
  async () => await runCommand("npx cypress run --browser chrome")
);

registeredTools.push("open-tests");
server.registerTool(
  "open-tests",
  { title: "Open Tests", description: "Open Cypress interactive test runner" },
  async () => await runCommand("npx cypress open")
);

registeredTools.push("generate-report");
server.registerTool(
  "generate-report",
  { title: "Generate Report", description: "Generate Mochawesome report" },
  async () => await runCommand("npx mochawesome-merge ./cypress/results/*.json > report.json && npx marge report.json")
);

registeredTools.push("run-smoke-tests");
server.registerTool(
  "run-smoke-tests",
  { title: "Run Smoke Tests", description: "Run tests tagged with @smoke" },
  async () => await runCommand("npx cypress run --env grep=@smoke")
);

// New BDD automation tools
registeredTools.push("automate-feature");
server.registerTool(
  "automate-feature",
  { 
    title: "Automate Feature File", 
    description: "Automatically execute feature file without step definitions using dynamic automation",
    inputSchema: {
      type: "object",
      properties: {
        featurePath: {
          type: "string",
          description: "Path to the feature file to automate"
        },
        headless: {
          type: "boolean",
          description: "Run in headless mode",
          default: false
        }
      },
      required: ["featurePath"]
    }
  },
  async ({ featurePath, headless = false }) => {
    const featureContent = await import('fs').then(fs => 
      fs.readFileSync(featurePath, 'utf8')
    );
    
    // Parse feature file and generate dynamic automation
    const steps = parseFeatureSteps(featureContent);
    const automationScript = generateAutomationScript(steps);
    
    // Write temporary automation script
    const tempScriptPath = `cypress/e2e/temp_automation.cy.js`;
    await import('fs').then(fs => 
      fs.writeFileSync(tempScriptPath, automationScript)
    );
    
    // Run the automation
    const headlessFlag = headless ? '--headless' : '';
    const result = await runCommand(`npx cypress run --spec "${tempScriptPath}" ${headlessFlag}`);
    
    // Clean up temp file
    try {
      await import('fs').then(fs => fs.unlinkSync(tempScriptPath));
    } catch (e) {
      console.log('Temp file cleanup failed:', e.message);
    }
    
    return result;
  }
);

registeredTools.push("parse-and-execute");
server.registerTool(
  "parse-and-execute",
  { 
    title: "Parse and Execute BDD", 
    description: "Parse BDD steps and execute them dynamically without step definitions",
    inputSchema: {
      type: "object",
      properties: {
        steps: {
          type: "array",
          description: "Array of BDD steps to execute",
          items: { type: "string" }
        },
        baseUrl: {
          type: "string",
          description: "Base URL for the application"
        }
      },
      required: ["steps"]
    }
  },
  async ({ steps, baseUrl }) => {
    const automationScript = generateDirectAutomationScript(steps, baseUrl);
    const tempScriptPath = `cypress/e2e/direct_automation.cy.js`;
    
    await import('fs').then(fs => 
      fs.writeFileSync(tempScriptPath, automationScript)
    );
    
    const result = await runCommand(`npx cypress run --spec "${tempScriptPath}"`);
    
    try {
      await import('fs').then(fs => fs.unlinkSync(tempScriptPath));
    } catch (e) {
      console.log('Temp file cleanup failed:', e.message);
    }
    
    return result;
  }
);

// ---------- Code generation helpers ----------
function toSafeName(name) {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+(\w)/g, (_, c) => c.toUpperCase())
    .replace(/^(\w)/, (_, c) => c.toLowerCase());
}

function featureNameFromContent(featureContent) {
  const m = featureContent.match(/Feature:\s*(.+)/i);
  return m ? m[1].trim() : `GeneratedFeature`;
}

function buildStepDefContents(featureName, steps, pageObjectClass, pageObjectImportPath) {
  const uniqueSteps = Array.from(new Set(steps));
  const lines = [];
  lines.push('import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";');
  lines.push(`import ${pageObjectClass} from "${pageObjectImportPath}";`);
  lines.push('');
  lines.push(`const page = new ${pageObjectClass}();`);
  lines.push('');

  for (const s of uniqueSteps) {
    let keyword = 'When';
    if (s.startsWith('Given')) keyword = 'Given';
    else if (s.startsWith('Then')) keyword = 'Then';

    // crude argument detection: keep quoted strings as {string}
    const pattern = s.replace(/^[A-Za-z]+\s+/, '')
      .replace(/"[^"]*"/g, '{string}');
    const rawParams = (s.match(/"[^"]*"/g) || []).map((_m, idx) => `arg${idx+1}`);
    const paramsSignature = rawParams.join(', ');

    const methodName = toSafeName(pattern.replace(/[^a-zA-Z0-9]+/g, ' ').trim());
    const stepLine = `${keyword}("${pattern}", (${paramsSignature}) => {`;
    lines.push(stepLine);
    lines.push(`  // TODO: implement step using page object`);
    lines.push(`  // Example: page.${methodName}(${paramsSignature});`);
    lines.push(`});`);
    lines.push('');
  }

  return lines.join('\n');
}

function buildPageObjectContents(className) {
  return `class ${className} {

  // Example locator methods – adjust to your AUT
  getByText(text) {
    return cy.contains(text, { matchCase: false });
  }

  getUsernameInput() {
    return cy.get('input[name="username"], input#username, input[type="email"], input[name="email"], input[name="login_id"], input#login_id');
  }

  getPasswordInput() {
    return cy.get('input[name="password"], input#password, input[type="password"], input[name="passwd"]');
  }

  getButtonByText(text) {
    return cy.contains('button, input[type="submit"]', text, { matchCase: false });
  }
}

export default ${className};
`;
}

// ---------- Code generation tools ----------
registeredTools.push("generate-step-definitions");
server.registerTool(
  "generate-step-definitions",
  {
    title: "Generate Step Definitions from Feature",
    description: "Reads a .feature file and generates a step definitions file.",
    inputSchema: {
      type: "object",
      properties: {
        featurePath: { type: "string", description: "Path to the feature file" },
        outDir: { type: "string", description: "Output directory for step defs", default: "cypress/support/step_definitions" },
        pageObjectPath: { type: "string", description: "Import path for page object", default: "../pageObjects/page" },
        pageObjectClass: { type: "string", description: "Class name for page object", default: "Page" },
        outFileName: { type: "string", description: "Optional file name for step defs" },
        overwrite: { type: "boolean", description: "Overwrite if exists", default: false }
      },
      required: ["featurePath"]
    }
  },
  async ({ featurePath, outDir = "cypress/support/step_definitions", pageObjectPath = "../pageObjects/page", pageObjectClass = "Page", outFileName, overwrite = false }) => {
    const fs = await import('fs');
    const path = await import('path');
    const featureContent = fs.readFileSync(featurePath, 'utf8');
    const steps = parseFeatureSteps(featureContent);
    const featureName = featureNameFromContent(featureContent);
    const baseName = outFileName || `${toSafeName(featureName)}.steps.js`;
    const destDir = outDir;
    const destPath = path.join(destDir, baseName);

    fs.mkdirSync(destDir, { recursive: true });
    if (fs.existsSync(destPath) && !overwrite) {
      return { content: [{ type: 'text', text: `Step definitions already exist at ${destPath}. Set overwrite=true to replace.` }] };
    }

    const fileContents = buildStepDefContents(featureName, steps, pageObjectClass, pageObjectPath);
    fs.writeFileSync(destPath, fileContents);
    return { content: [{ type: 'text', text: `Generated step definitions: ${destPath}` }] };
  }
);

registeredTools.push("generate-page-object");
server.registerTool(
  "generate-page-object",
  {
    title: "Generate Page Object",
    description: "Creates a page object class file with basic locator helpers.",
    inputSchema: {
      type: "object",
      properties: {
        className: { type: "string", description: "Class name for the page object", default: "Page" },
        outDir: { type: "string", description: "Output directory", default: "cypress/support/pageObjects" },
        outFileName: { type: "string", description: "Optional file name for page object" },
        overwrite: { type: "boolean", description: "Overwrite if exists", default: false }
      }
    }
  },
  async ({ className = "Page", outDir = "cypress/support/pageObjects", outFileName, overwrite = false }) => {
    const fs = await import('fs');
    const path = await import('path');
    const fileName = outFileName || `${toSafeName(className)}.js`;
    const destPath = path.join(outDir, fileName);
    fs.mkdirSync(outDir, { recursive: true });
    if (fs.existsSync(destPath) && !overwrite) {
      return { content: [{ type: 'text', text: `Page object already exists at ${destPath}. Set overwrite=true to replace.` }] };
    }
    const contents = buildPageObjectContents(className);
    fs.writeFileSync(destPath, contents);
    return { content: [{ type: 'text', text: `Generated page object: ${destPath}` }] };
  }
);

registeredTools.push("scaffold-from-feature");
server.registerTool(
  "scaffold-from-feature",
  {
    title: "Scaffold Step Defs and Page Object from Feature",
    description: "Generates a page object and step definitions based on a .feature file.",
    inputSchema: {
      type: "object",
      properties: {
        featurePath: { type: "string", description: "Path to the feature file" },
        pageObjectClass: { type: "string", description: "Class name for page object", default: "Page" },
        stepDefsOutDir: { type: "string", description: "Output dir for step defs", default: "cypress/support/step_definitions" },
        pageObjectOutDir: { type: "string", description: "Output dir for page objects", default: "cypress/support/pageObjects" },
        overwrite: { type: "boolean", description: "Overwrite existing files", default: false }
      },
      required: ["featurePath"]
    }
  },
  async ({ featurePath, pageObjectClass = "Page", stepDefsOutDir = "cypress/support/step_definitions", pageObjectOutDir = "cypress/support/pageObjects", overwrite = false }) => {
    const fs = await import('fs');
    const path = await import('path');
    const featureContent = fs.readFileSync(featurePath, 'utf8');
    const steps = parseFeatureSteps(featureContent);
    const featureName = featureNameFromContent(featureContent);

    // Generate PO
    const poFileName = `${toSafeName(pageObjectClass)}.js`;
    const poPath = path.join(pageObjectOutDir, poFileName);
    fs.mkdirSync(pageObjectOutDir, { recursive: true });
    if (!fs.existsSync(poPath) || overwrite) {
      fs.writeFileSync(poPath, buildPageObjectContents(pageObjectClass));
    }

    // Generate step defs
    const stepFileName = `${toSafeName(featureName)}.steps.js`;
    const stepPath = path.join(stepDefsOutDir, stepFileName);
    fs.mkdirSync(stepDefsOutDir, { recursive: true });
    if (!fs.existsSync(stepPath) || overwrite) {
      const relImport = path.relative(stepDefsOutDir, path.join(pageObjectOutDir, poFileName)).replace(/\\/g, '/');
      const importPath = relImport.startsWith('.') ? relImport : `./${relImport}`;
      const contents = buildStepDefContents(featureName, steps, pageObjectClass, importPath);
      fs.writeFileSync(stepPath, contents);
    }

    return { content: [{ type: 'text', text: `Scaffolded:\n- Page Object: ${poPath}\n- Step Definitions: ${stepPath}` }] };
  }
);

// Establish stdio connection so Cursor can discover tools
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("🚀 Cypress MCP server started and connected over stdio. Tools registered.");
console.error("🔧 Tools:", registeredTools.join(", "));
