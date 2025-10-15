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

function generateFixedAutomationScript(steps, baseUrl) {
  let script = `describe('Fixed LoginYopmail Automation', () => {
  it('executes LoginYopmail BDD steps with element coverage fixes', () => {
`;
  
  if (baseUrl) {
    script += `    cy.visit('${baseUrl}');
    cy.wait(3000); // Wait for page to fully load
    cy.screenshot('01-login-page-loaded');
`;
  }
  
  for (const step of steps) {
    const automationCode = convertStepToAutomationFixed(step);
    script += `    ${automationCode}\n`;
  }
  
  script += `  });
});`;
  
  return script;
}

function convertStepToAutomationFixed(step) {
  // Visit login page
  if (step.includes('I am on the login page') && step.includes('https://statementzen.com/sign-in/')) {
    return `// Step: ${step}
    cy.visit('https://statementzen.com/sign-in/', { failOnStatusCode: false });
    cy.wait(3000);
    cy.screenshot('02-login-page');`;
  }
  
  // Enter email in email field - Fixed for element coverage
  if (step.includes('enters email') && step.includes('statement.aktest2@yopmail.com')) {
    return `// Step: ${step}
    cy.log('Looking for email input field...');
    
    // Wait for page to be fully interactive
    cy.get('body').should('be.visible');
    cy.wait(1000);
    
    // Try to find and interact with email field, handling coverage issues
    cy.get('input[type="email"], input[name="email"], input[id="otp-email"]').should('be.visible').then(($input) => {
      // Scroll element into view
      cy.get('input[type="email"], input[name="email"], input[id="otp-email"]').scrollIntoView();
      cy.wait(500);
      
      // Clear any existing content and type email
      cy.get('input[type="email"], input[name="email"], input[id="otp-email"]').clear().type('statement.aktest2@yopmail.com', { force: true });
    });
    cy.wait(2000);
    cy.screenshot('03-email-entered');`;
  }
  
  // Click Send One Time Code button - Fixed for element coverage
  if (step.includes('click') && step.includes('Send One Time Code')) {
    return `// Step: ${step}
    cy.log('Looking for Send One Time Code button...');
    
    // Wait for button to be visible and clickable
    cy.get('button, input[type="submit"]').contains('Send One Time Code').should('be.visible').then(($button) => {
      // Scroll button into view
      cy.get('button, input[type="submit"]').contains('Send One Time Code').scrollIntoView();
      cy.wait(500);
      
      // Click with force to handle coverage issues
      cy.get('button, input[type="submit"]').contains('Send One Time Code').click({ force: true });
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
    cy.get('input[name="login"], input[placeholder*="email"], input[type="text"]').scrollIntoView();
    cy.wait(500);
    cy.get('input[name="login"], input[placeholder*="email"], input[type="text"]').type('statement.aktest2@yopmail.com', { force: true });
    cy.wait(1000);
    cy.screenshot('06-yopmail-email-entered');`;
  }
  
  // Click next button
  if (step.includes('click next button')) {
    return `// Step: ${step}
    cy.get('button:contains("Next"), button:contains("next"), button[type="submit"], input[type="submit"]').scrollIntoView();
    cy.wait(500);
    cy.get('button:contains("Next"), button:contains("next"), button[type="submit"], input[type="submit"]').click({ force: true });
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
      cy.get('input[name="otp"], input[placeholder*="OTP"], input[placeholder*="otp"], input[type="text"], input[name="code"]').scrollIntoView();
      cy.wait(500);
      cy.get('input[name="otp"], input[placeholder*="OTP"], input[placeholder*="otp"], input[type="text"], input[name="code"]').type(otp, { force: true });
    });
    cy.wait(2000);
    cy.screenshot('10-otp-pasted');`;
  }
  
  // Default fallback
  return `// ${step} - No automation mapping found`;
}

async function runFixedAutomation() {
  try {
    console.log('🚀 Starting LoginYopmail fixed automation...');
    
    // Read feature file
    const featurePath = 'cypress/e2e/features/LoginYopmail.feature';
    const featureContent = fs.readFileSync(featurePath, 'utf8');
    
    console.log('📖 Feature content loaded');
    
    // Parse feature file and generate fixed automation
    const steps = parseFeatureSteps(featureContent);
    console.log(`📝 Found ${steps.length} steps to automate`);
    
    const automationScript = generateFixedAutomationScript(steps, 'https://statementzen.com/sign-in/');
    
    // Write temporary automation script
    const tempScriptPath = `cypress/e2e/fixed_login_yopmail.cy.js`;
    fs.writeFileSync(tempScriptPath, automationScript);
    
    console.log('📄 Generated fixed automation script:', tempScriptPath);
    
    // Run the automation in headed mode
    console.log('🏃 Running fixed automation in Chrome headed mode...');
    const result = await runCommand(`npx cypress run --spec "${tempScriptPath}" --browser chrome --headed`);
    
    console.log('✅ Fixed automation completed');
    console.log('Result:', result.content[0].text);
    
    // Don't clean up temp file so we can inspect it
    console.log('📁 Fixed script saved at:', tempScriptPath);
    
  } catch (error) {
    console.error('❌ Error during fixed automation:', error.message);
  }
}

// Run the fixed automation
runFixedAutomation();
