#!/usr/bin/env node
import { exec } from "child_process";
import { promisify } from "util";
import fs from 'fs';

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

function generateDebugAutomationScript(steps, baseUrl) {
  let script = `describe('Debug LoginYopmail Automation', () => {
  it('executes LoginYopmail BDD steps with debugging', () => {
`;
  
  if (baseUrl) {
    script += `    cy.visit('${baseUrl}');
    cy.wait(3000); // Wait for page to fully load
    cy.screenshot('01-login-page-loaded');
    
    // Debug: Log all input fields on the page
    cy.get('input').then(($inputs) => {
      cy.log('Found ' + $inputs.length + ' input fields');
      $inputs.each((index, input) => {
        cy.log('Input ' + index + ': type=' + input.type + ', name=' + input.name + ', placeholder=' + input.placeholder + ', id=' + input.id);
      });
    });
`;
  }
  
  for (const step of steps) {
    const automationCode = convertStepToAutomationWithDebug(step);
    script += `    ${automationCode}\n`;
  }
  
  script += `  });
});`;
  
  return script;
}

function convertStepToAutomationWithDebug(step) {
  // Visit login page
  if (step.includes('I am on the login page') && step.includes('https://statementzen.com/sign-in/')) {
    return `// Step: ${step}
    cy.visit('https://statementzen.com/sign-in/', { failOnStatusCode: false });
    cy.wait(3000);
    cy.screenshot('02-login-page');`;
  }
  
  // Enter email in email field - Enhanced debugging
  if (step.includes('enters email') && step.includes('statement.aktest2@yopmail.com')) {
    return `// Step: ${step}
    cy.log('Looking for email input field...');
    
    // Try multiple selectors for email field
    cy.get('body').then(($body) => {
      if ($body.find('input[name="email"]').length > 0) {
        cy.log('Found input[name="email"]');
        cy.get('input[name="email"]').type('statement.aktest2@yopmail.com');
      } else if ($body.find('input[type="email"]').length > 0) {
        cy.log('Found input[type="email"]');
        cy.get('input[type="email"]').type('statement.aktest2@yopmail.com');
      } else if ($body.find('input[placeholder*="email"]').length > 0) {
        cy.log('Found input[placeholder*="email"]');
        cy.get('input[placeholder*="email"]').type('statement.aktest2@yopmail.com');
      } else if ($body.find('input[placeholder*="Email"]').length > 0) {
        cy.log('Found input[placeholder*="Email"]');
        cy.get('input[placeholder*="Email"]').type('statement.aktest2@yopmail.com');
      } else if ($body.find('input[name="login_id"]').length > 0) {
        cy.log('Found input[name="login_id"]');
        cy.get('input[name="login_id"]').type('statement.aktest2@yopmail.com');
      } else if ($body.find('input[id="login_id"]').length > 0) {
        cy.log('Found input[id="login_id"]');
        cy.get('input[id="login_id"]').type('statement.aktest2@yopmail.com');
      } else {
        cy.log('No email field found, trying generic input');
        cy.get('input').first().type('statement.aktest2@yopmail.com');
      }
    });
    cy.wait(2000);
    cy.screenshot('03-email-entered');`;
  }
  
  // Click Send One Time Code button - Enhanced debugging
  if (step.includes('click') && step.includes('Send One Time Code')) {
    return `// Step: ${step}
    cy.log('Looking for Send One Time Code button...');
    
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Send One Time Code")').length > 0) {
        cy.log('Found button:contains("Send One Time Code")');
        cy.get('button:contains("Send One Time Code")').click();
      } else if ($body.find('input[value*="Send One Time Code"]').length > 0) {
        cy.log('Found input[value*="Send One Time Code"]');
        cy.get('input[value*="Send One Time Code"]').click();
      } else if ($body.find('button[type="submit"]').length > 0) {
        cy.log('Found button[type="submit"]');
        cy.get('button[type="submit"]').click();
      } else {
        cy.log('No Send OTP button found, trying generic button');
        cy.get('button').first().click();
      }
    });
    cy.wait(3000);
    cy.screenshot('04-otp-sent');`;
  }
  
  // Visit yopmail
  if (step.includes('visit') && step.includes('yopmail')) {
    return `// Step: ${step}
    cy.visit('https://yopmail.com/en/', { failOnStatusCode: false });
    cy.wait(3000);
    cy.screenshot('05-yopmail-loaded');`;
  }
  
  // Enter email in yopmail
  if (step.includes('enter email') && step.includes('statement.aktest2@yopmail.com')) {
    return `// Step: ${step}
    cy.log('Looking for yopmail email input...');
    cy.get('input[name="login"], input[placeholder*="email"], input[type="text"]').type('statement.aktest2@yopmail.com');
    cy.wait(1000);
    cy.screenshot('06-yopmail-email-entered');`;
  }
  
  // Click next button
  if (step.includes('click next button')) {
    return `// Step: ${step}
    cy.get('button:contains("Next"), button:contains("next"), button[type="submit"], input[type="submit"]').click();
    cy.wait(3000);
    cy.screenshot('07-yopmail-next-clicked');`;
  }
  
  // Should see One Time Code
  if (step.includes('should see One Time Code')) {
    return `// Step: ${step}
    cy.contains('One Time Code', { matchCase: false }).should('be.visible');
    cy.wait(1000);
    cy.screenshot('08-otp-visible');`;
  }
  
  // Copy OTP code
  if (step.includes('copy OTP code')) {
    return `// Step: ${step}
    cy.get('body').then(($body) => {
      const otpText = $body.text();
      const otpMatch = otpText.match(/\\b\\d{6}\\b/);
      if (otpMatch) {
        cy.wrap(otpMatch[0]).as('otpCode');
        cy.log('OTP Code found: ' + otpMatch[0]);
      }
    });
    cy.wait(1000);
    cy.screenshot('09-otp-copied');`;
  }
  
  // Paste OTP code
  if (step.includes('paste OTP code')) {
    return `// Step: ${step}
    cy.get('@otpCode').then((otp) => {
      cy.log('Using OTP: ' + otp);
      cy.visit('https://statementzen.com/sign-in/', { failOnStatusCode: false });
      cy.wait(2000);
      cy.get('input[name="otp"], input[placeholder*="OTP"], input[placeholder*="otp"], input[type="text"], input[name="code"]').type(otp);
    });
    cy.wait(2000);
    cy.screenshot('10-otp-pasted');`;
  }
  
  // Default fallback
  return `// ${step} - No automation mapping found`;
}

async function debugAutomation() {
  try {
    console.log('🚀 Starting LoginYopmail debug automation...');
    
    // Read feature file
    const featurePath = 'cypress/e2e/features/LoginYopmail.feature';
    const featureContent = fs.readFileSync(featurePath, 'utf8');
    
    console.log('📖 Feature content loaded');
    
    // Parse feature file and generate debug automation
    const steps = parseFeatureSteps(featureContent);
    console.log(`📝 Found ${steps.length} steps to debug`);
    
    const automationScript = generateDebugAutomationScript(steps, 'https://statementzen.com/sign-in/');
    
    // Write temporary automation script
    const tempScriptPath = `cypress/e2e/debug_login_yopmail.cy.js`;
    fs.writeFileSync(tempScriptPath, automationScript);
    
    console.log('📄 Generated debug automation script:', tempScriptPath);
    
    // Run the automation in headed mode with debugging
    console.log('🏃 Running debug automation in Chrome headed mode...');
    const result = await runCommand(`npx cypress run --spec "${tempScriptPath}" --browser chrome --headed`);
    
    console.log('✅ Debug automation completed');
    console.log('Result:', result.content[0].text);
    
    // Don't clean up temp file so we can inspect it
    console.log('📁 Debug script saved at:', tempScriptPath);
    
  } catch (error) {
    console.error('❌ Error during debug automation:', error.message);
  }
}

// Run the debug automation
debugAutomation();
