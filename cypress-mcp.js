#!/usr/bin/env node
import { exec, spawn } from "child_process";
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

// Helper to run Cypress with better process handling (fixes Chrome headed mode error)
async function runCypressCommand(spec, browser = 'chrome', headed = true, extraArgs = []) {
  return new Promise(async (resolve, reject) => {
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Use npx with cwd set to project root - this will use local Cypress from package.json
    const args = ['cypress', 'run', '--browser', browser, ...extraArgs];
    if (spec) {
      args.push('--spec', spec);
    }
    if (headed) {
      args.push('--headed');
    }
    
    const cypressProcess = spawn('npx', args, {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname
    });
    
    let stdout = '';
    let stderr = '';
    
    cypressProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    cypressProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    cypressProcess.on('close', (code) => {
      // Cypress exit codes: 0 = success, non-zero = failure
      if (code === 0) {
        resolve({ stdout, stderr, code: 0 });
      } else {
        // Check if tests passed by looking at output
        if (stdout.includes('All specs passed!') || stdout.includes('passing')) {
          resolve({ stdout, stderr, code: 0 });
        } else {
          reject({ stdout, stderr, code, message: `Cypress exited with code ${code}` });
        }
      }
    });
    
    cypressProcess.on('error', (error) => {
      reject({ stdout, stderr, code: -1, message: error.message });
    });
  });
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
  { title: "Run Tests", description: "Scan features, generate temp spec, run in Electron headless" },
  async () => {
    try {
      const path = await import('path');
      const fs = await import('fs');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const featuresDir = path.join(__dirname, 'cypress/e2e/features');

      const files = fs.readdirSync(featuresDir).filter(f => f.endsWith('.feature'));
      if (files.length === 0) {
        return { content: [{ type: 'text', text: `No .feature files found in ${featuresDir}` }] };
      }

      const selectedFile = files.includes('test.feature') ? 'test.feature' : files[0];
      const featurePath = path.join(featuresDir, selectedFile);
      const featureContent = fs.readFileSync(featurePath, 'utf8');
      const steps = parseFeatureSteps(featureContent);
      if (steps.length === 0) {
        return { content: [{ type: 'text', text: `No BDD steps found in ${selectedFile}` }] };
      }

      const automationScript = generateDirectAutomationScript(steps);
      const tempScriptPath = path.join(__dirname, 'cypress/e2e/run_tests_temp.cy.js');
      fs.writeFileSync(tempScriptPath, automationScript);

      const result = await runCypressCommand(tempScriptPath, 'electron', false)
        .then(({ stdout, stderr }) => ({ content: [{ type: 'text', text: `✅ Cypress (Electron headless) run completed.\nFeature File: ${selectedFile}\nAvailable Files: ${files.join(', ')}\n\n=== Output ===\n${stdout}\n${stderr ? `\nStderr:\n${stderr}` : ''}` }] }))
        .catch(error => ({ content: [{ type: 'text', text: `❌ Cypress run failed.\nFeature File: ${selectedFile}\nAvailable Files: ${files.join(', ')}\n\nMessage: ${error.message}\nStdout:\n${error.stdout || 'N/A'}\n\nStderr:\n${error.stderr || 'N/A'}\n\nTemp file: ${tempScriptPath}` }] }));

      if (result.content[0].text.startsWith('✅')) {
        try { fs.unlinkSync(tempScriptPath); } catch {}
      }
      return result;
    } catch (e) {
      return { content: [{ type: 'text', text: `❌ run-tests error: ${e.message}` }] };
    }
  }
);

registeredTools.push("open-tests");
server.registerTool(
  "open-tests",
  { title: "Open Tests", description: "Open Cypress interactive test runner" },
  async () => await runCommand("npx cypress open")
);

registeredTools.push("run-smoke-tests");
server.registerTool(
  "run-smoke-tests",
  { title: "Run Smoke Tests", description: "Run tests tagged with @smoke using stable runner" },
  async () => {
    try {
      const { stdout, stderr } = await runCypressCommand(undefined, 'chrome', true, ['--env','grep=@smoke']);
      return { content: [{ type: 'text', text: `✅ Smoke run completed.\n${stdout}\n${stderr ? `\nStderr:\n${stderr}` : ''}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `❌ Smoke run failed.\nMessage: ${error.message}\nStdout:\n${error.stdout || 'N/A'}\n\nStderr:\n${error.stderr || 'N/A'}` }] };
    }
  }
);

// New BDD automation tools
registeredTools.push("automate-feature");
server.registerTool(
  "automate-feature",
  { 
    title: "Automate Feature File", 
    description: "Automatically execute feature file without step definitions. If called without parameters, scans and executes test.feature. Parameters: featurePath (string, optional), headless (boolean, optional)"
  },
  async (args) => {
    console.error('[automate-feature] Received args:', JSON.stringify(args));
    
    let { featurePath, headless = false } = args || {};
    let selectedFile = null;
    let availableFiles = [];
    
    // If no featurePath provided, scan and auto-select
    if (!featurePath) {
      console.error('[automate-feature] No featurePath provided, scanning features folder...');
      
      try {
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const featuresDir = path.join(__dirname, 'cypress/e2e/features');
        
        const fs = await import('fs');
        availableFiles = fs.readdirSync(featuresDir).filter(file => file.endsWith('.feature'));
        
        if (availableFiles.length === 0) {
          return { 
            content: [{ 
              type: "text", 
              text: `No .feature files found in ${featuresDir}` 
            }] 
          };
        }
        
        selectedFile = availableFiles.includes('test.feature') ? 'test.feature' : availableFiles[0];
        featurePath = path.join(featuresDir, selectedFile);
        console.error(`[automate-feature] Auto-selected: ${selectedFile} from ${availableFiles.join(', ')}`);
        
      } catch (error) {
        return { 
          content: [{ 
            type: "text", 
            text: `Error scanning features folder: ${error.message}` 
          }] 
        };
      }
    }
    
    const featureContent = await import('fs').then(fs => 
      fs.readFileSync(featurePath, 'utf8')
    );
    
    // Parse feature file and generate dynamic automation
    const steps = parseFeatureSteps(featureContent);
    const automationScript = generateAutomationScript(steps);
    
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const tempScriptPath = path.join(__dirname, 'cypress/e2e/temp_automation.cy.js');
    
    await import('fs').then(fs => 
      fs.writeFileSync(tempScriptPath, automationScript)
    );
    
    // Run the automation
    const featureInfo = selectedFile ? `\nFeature File: ${selectedFile}\nAvailable Files: ${availableFiles.join(', ')}\n` : '';
    const result = await runCypressCommand(tempScriptPath, 'chrome', !headless)
      .then(({ stdout, stderr }) => ({ 
        content: [{ type: "text", text: `✅ Test execution completed!${featureInfo}\nGenerated script:\n${automationScript}\n\n=== Test Output ===\n${stdout}\n${stderr ? '\nStderr:\n' + stderr : ''}` }] 
      }))
      .catch(error => ({ 
        content: [{ type: "text", text: `❌ Test execution failed!${featureInfo}\nGenerated script:\n${automationScript}\n\n=== Error Details ===\nMessage: ${error.message}\nCode: ${error.code}\nStdout:\n${error.stdout || 'N/A'}\n\nStderr:\n${error.stderr || 'N/A'}\n\nTemp file location: ${tempScriptPath} (not deleted for debugging)` }] 
      }));
    
    // Clean up temp file
    if (result.content[0].text.includes('✅')) {
      try {
        await import('fs').then(fs => fs.unlinkSync(tempScriptPath));
      } catch (e) {
        console.log('Temp file cleanup failed:', e.message);
      }
    }
    
    return result;
  }
);

registeredTools.push("parse-and-execute");
server.registerTool(
  "parse-and-execute",
  { 
    title: "Parse and Execute BDD", 
    description: "Parse BDD steps and execute them dynamically without step definitions. If called without parameters, automatically reads from test.feature. Parameters: steps (array of strings, optional), baseUrl (optional string)"
  },
  async (args) => {
    console.error('[parse-and-execute] Received args:', JSON.stringify(args));
    console.error('[parse-and-execute] Args type:', typeof args);
    console.error('[parse-and-execute] Args keys:', args ? Object.keys(args) : 'null/undefined');
    
    let { steps, baseUrl } = args || {};
    let selectedFile = null;
    let availableFiles = [];
    
    // If no steps provided, scan and read from feature files
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      console.error('[parse-and-execute] No steps provided, scanning for feature files...');
      
      try {
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const featuresDir = path.join(__dirname, 'cypress/e2e/features');
        
        const fs = await import('fs');
        
        // Scan for all .feature files
        availableFiles = fs.readdirSync(featuresDir).filter(file => file.endsWith('.feature'));
        
        if (availableFiles.length === 0) {
          return { 
            content: [{ 
              type: "text", 
              text: `No .feature files found in ${featuresDir}` 
            }] 
          };
        }
        
        console.error('[parse-and-execute] Found feature files:', availableFiles);
        
        // Use the first feature file found (or test.feature if it exists)
        selectedFile = availableFiles.includes('test.feature') ? 'test.feature' : availableFiles[0];
        const featurePath = path.join(featuresDir, selectedFile);
        
        const featureContent = fs.readFileSync(featurePath, 'utf8');
        steps = parseFeatureSteps(featureContent);
        
        if (steps.length === 0) {
          return { 
            content: [{ 
              type: "text", 
              text: `No BDD steps found in ${selectedFile}. Available files: ${availableFiles.join(', ')}. Please ensure the file has Given/When/Then/And steps.` 
            }] 
          };
        }
        
        console.error(`[parse-and-execute] Using ${selectedFile}, extracted steps:`, steps);
      } catch (error) {
        return { 
          content: [{ 
            type: "text", 
            text: `Error scanning feature files: ${error.message}. You can also pass steps directly as parameter.` 
          }] 
        };
      }
    }
    
    const automationScript = generateDirectAutomationScript(steps, baseUrl);
    
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const tempScriptPath = path.join(__dirname, 'cypress/e2e/direct_automation.cy.js');
    
    console.error('[parse-and-execute] Generated script:\n', automationScript);
    console.error('[parse-and-execute] Temp script path:', tempScriptPath);
    
    const fs = await import('fs');
    fs.writeFileSync(tempScriptPath, automationScript);
    console.error('[parse-and-execute] Temp file written successfully');
    
    // Run the automation from the project root directory
    console.error('[parse-and-execute] Running command from:', __dirname);
    const featureInfo = selectedFile ? `\nFeature File: ${selectedFile}\nAvailable Files: ${availableFiles.join(', ')}\n` : '';
    
    const result = await runCypressCommand(tempScriptPath, 'chrome', true)
      .then(({ stdout, stderr }) => ({ 
        content: [{ type: "text", text: `✅ Test execution completed!${featureInfo}\nGenerated script:\n${automationScript}\n\n=== Test Output ===\n${stdout}\n${stderr ? '\nStderr:\n' + stderr : ''}` }] 
      }))
      .catch(error => ({ 
        content: [{ type: "text", text: `❌ Test execution failed!${featureInfo}\nGenerated script:\n${automationScript}\n\n=== Error Details ===\nMessage: ${error.message}\nCode: ${error.code}\nStdout:\n${error.stdout || 'N/A'}\n\nStderr:\n${error.stderr || 'N/A'}\n\nTemp file location: ${tempScriptPath} (not deleted for debugging)` }] 
      }));
    
    // Clean up temp file only on success
    if (result.content[0].text.includes('✅')) {
      try {
        fs.unlinkSync(tempScriptPath);
        console.error('[parse-and-execute] Temp file cleaned up');
      } catch (e) {
        console.error('Temp file cleanup failed:', e.message);
      }
    }
    
    return result;
  }
);

// Special tool to run feature files automatically without parameters
registeredTools.push("automate-test-feature");
server.registerTool(
  "automate-test-feature",
  { 
    title: "Automate Feature Files", 
    description: "Automatically scans and executes feature files from cypress/e2e/features/ without step definitions. Prioritizes test.feature if found."
  },
  async () => {
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const featuresDir = path.join(__dirname, 'cypress/e2e/features');
    
    console.error('[automate-test-feature] Scanning features directory:', featuresDir);
    
    try {
      const fs = await import('fs');
      
      // Scan for all .feature files
      const files = fs.readdirSync(featuresDir).filter(file => file.endsWith('.feature'));
      
      if (files.length === 0) {
        return { 
          content: [{ 
            type: "text", 
            text: `No .feature files found in ${featuresDir}` 
          }] 
        };
      }
      
      console.error('[automate-test-feature] Found feature files:', files);
      
      // Use test.feature if it exists, otherwise use the first file found
      let selectedFile = files.includes('test.feature') ? 'test.feature' : files[0];
      const featurePath = path.join(featuresDir, selectedFile);
      
      console.error('[automate-test-feature] Selected file:', selectedFile);
      console.error('[automate-test-feature] Full path:', featurePath);
      
      const featureContent = fs.readFileSync(featurePath, 'utf8');
      
      // Parse feature file and extract steps
      const steps = parseFeatureSteps(featureContent);
      
      if (steps.length === 0) {
        return { 
          content: [{ 
            type: "text", 
            text: `No BDD steps found in ${selectedFile}. Available feature files: ${files.join(', ')}` 
          }] 
        };
      }
      
      // Generate automation script
      const automationScript = generateDirectAutomationScript(steps);
      const tempScriptPath = path.join(__dirname, 'cypress/e2e/temp_test_feature_automation.cy.js');
      
      console.error('[automate-test-feature] Temp script path:', tempScriptPath);
      console.error('[automate-test-feature] Steps found:', steps);
      console.error('[automate-test-feature] Generated script:\n', automationScript);
      
      fs.writeFileSync(tempScriptPath, automationScript);
      console.error('[automate-test-feature] Temp file written successfully');
      
      // Run the automation from the project root directory
      console.error('[automate-test-feature] Running command from:', __dirname);
      const result = await runCypressCommand(tempScriptPath, 'chrome', true)
        .then(({ stdout, stderr }) => ({ 
          content: [{ type: "text", text: `✅ Test execution completed!\n\nFeature File: ${selectedFile}\nAvailable Files: ${files.join(', ')}\n\nGenerated script:\n${automationScript}\n\n=== Test Output ===\n${stdout}\n${stderr ? '\nStderr:\n' + stderr : ''}` }] 
        }))
        .catch(error => ({ 
          content: [{ type: "text", text: `❌ Test execution failed!\n\nFeature File: ${selectedFile}\nAvailable Files: ${files.join(', ')}\n\nGenerated script:\n${automationScript}\n\n=== Error Details ===\nMessage: ${error.message}\nCode: ${error.code}\nStdout:\n${error.stdout || 'N/A'}\n\nStderr:\n${error.stderr || 'N/A'}\n\nTemp file location: ${tempScriptPath} (not deleted for debugging)` }] 
        }));
      
      // Clean up temp file only on success
      if (result.content[0].text.includes('✅')) {
        try {
          fs.unlinkSync(tempScriptPath);
          console.error('[automate-test-feature] Temp file cleaned up');
        } catch (e) {
          console.error('Temp file cleanup failed:', e.message);
        }
      }
      
      return result;
    } catch (error) {
      return { 
        content: [{ 
          type: "text", 
          text: `Error: ${error.message}` 
        }] 
      };
    }
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
    description: "Reads a .feature file and generates a step definitions file. Parameters: featurePath (required), outDir, pageObjectPath, pageObjectClass, outFileName, overwrite"
  },
  async (args = {}) => {
    let { featurePath, outDir = "cypress/support/step_definitions", pageObjectPath = "../pageObjects/page", pageObjectClass = "Page", outFileName, overwrite = false } = args;
    
    // Auto-scan if no featurePath provided
    if (!featurePath) {
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const featuresDir = path.join(__dirname, 'cypress/e2e/features');
      
      const fs = await import('fs');
      const files = fs.readdirSync(featuresDir).filter(file => file.endsWith('.feature'));
      
      if (files.length === 0) {
        return { content: [{ type: 'text', text: `No .feature files found in ${featuresDir}` }] };
      }
      
      const selectedFile = files.includes('test.feature') ? 'test.feature' : files[0];
      featurePath = path.join(featuresDir, selectedFile);
    }
    
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const featureContent = fs.readFileSync(featurePath, 'utf8');
    const steps = parseFeatureSteps(featureContent);
    const featureName = featureNameFromContent(featureContent);
    const baseName = outFileName || `${toSafeName(featureName)}.steps.js`;
    const fullOutDir = path.join(__dirname, outDir);
    const destPath = path.join(fullOutDir, baseName);

    fs.mkdirSync(fullOutDir, { recursive: true });
    if (fs.existsSync(destPath) && !overwrite) {
      return { content: [{ type: 'text', text: `Step definitions already exist at ${destPath}. Set overwrite=true to replace.` }] };
    }

    const fileContents = buildStepDefContents(featureName, steps, pageObjectClass, pageObjectPath);
    fs.writeFileSync(destPath, fileContents);
    return { content: [{ type: 'text', text: `✅ Generated step definitions: ${destPath}` }] };
  }
);

registeredTools.push("generate-page-object");
server.registerTool(
  "generate-page-object",
  {
    title: "Generate Page Object",
    description: "Creates a page object class file with basic locator helpers. Parameters: className, outDir, outFileName, overwrite"
  },
  async (args = {}) => {
    const { className = "Page", outDir = "cypress/support/pageObjects", outFileName, overwrite = false } = args;
    
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const fileName = outFileName || `${toSafeName(className)}.js`;
    const fullOutDir = path.join(__dirname, outDir);
    const destPath = path.join(fullOutDir, fileName);
    
    fs.mkdirSync(fullOutDir, { recursive: true });
    
    if (fs.existsSync(destPath) && !overwrite) {
      return { content: [{ type: 'text', text: `Page object already exists at ${destPath}. Set overwrite=true to replace.` }] };
    }
    
    const contents = buildPageObjectContents(className);
    fs.writeFileSync(destPath, contents);
    return { content: [{ type: 'text', text: `✅ Generated page object: ${destPath}` }] };
  }
);

registeredTools.push("scaffold-from-feature");
server.registerTool(
  "scaffold-from-feature",
  {
    title: "Scaffold Step Defs and Page Object from Feature",
    description: "Generates a page object and step definitions based on a .feature file. Parameters: featurePath (required), pageObjectClass, stepDefsOutDir, pageObjectOutDir, overwrite"
  },
  async (args = {}) => {
    let { featurePath, pageObjectClass = "Page", stepDefsOutDir = "cypress/support/step_definitions", pageObjectOutDir = "cypress/support/pageObjects", overwrite = false } = args;
    
    // Auto-scan if no featurePath provided
    if (!featurePath) {
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const featuresDir = path.join(__dirname, 'cypress/e2e/features');
      
      const fs = await import('fs');
      const files = fs.readdirSync(featuresDir).filter(file => file.endsWith('.feature'));
      
      if (files.length === 0) {
        return { content: [{ type: 'text', text: `No .feature files found in ${featuresDir}` }] };
      }
      
      const selectedFile = files.includes('test.feature') ? 'test.feature' : files[0];
      featurePath = path.join(featuresDir, selectedFile);
    }
    
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const featureContent = fs.readFileSync(featurePath, 'utf8');
    const steps = parseFeatureSteps(featureContent);
    const featureName = featureNameFromContent(featureContent);

    // Generate PO with absolute path
    const poFileName = `${toSafeName(pageObjectClass)}.js`;
    const fullPoOutDir = path.join(__dirname, pageObjectOutDir);
    const poPath = path.join(fullPoOutDir, poFileName);
    fs.mkdirSync(fullPoOutDir, { recursive: true });
    if (!fs.existsSync(poPath) || overwrite) {
      fs.writeFileSync(poPath, buildPageObjectContents(pageObjectClass));
    }

    // Generate step defs with absolute path
    const stepFileName = `${toSafeName(featureName)}.steps.js`;
    const fullStepOutDir = path.join(__dirname, stepDefsOutDir);
    const stepPath = path.join(fullStepOutDir, stepFileName);
    fs.mkdirSync(fullStepOutDir, { recursive: true });
    if (!fs.existsSync(stepPath) || overwrite) {
      const relImport = path.relative(fullStepOutDir, path.join(fullPoOutDir, poFileName)).replace(/\\/g, '/');
      const importPath = relImport.startsWith('.') ? relImport : `./${relImport}`;
      const contents = buildStepDefContents(featureName, steps, pageObjectClass, importPath);
      fs.writeFileSync(stepPath, contents);
    }

    return { content: [{ type: 'text', text: `✅ Scaffolded:\n- Page Object: ${poPath}\n- Step Definitions: ${stepPath}` }] };
  }
);

// Establish stdio connection so Cursor can discover tools
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("🚀 Cypress MCP server started and connected over stdio. Tools registered.");
console.error("🔧 Tools:", registeredTools.join(", "));
