// cypress/support/tempSms.js
export function fetchOtpFromTempSms(pageUrl, timeout = 30000, interval = 2000) {
    const start = Date.now();
  
    function check() {
      return cy.request({ url: pageUrl, method: 'GET' }).then((resp) => {
        const html = resp.body;
        // Try specific pattern first
        let match = html.match(/Your Intuit Code is\s*([0-9]{4,6})/i);
        if (!match) {
          // fallback: any 6-digit number
          match = html.match(/(\d{6})/);
        }
  
        if (match && (match[1] || match[0])) {
          return cy.wrap(match[1] || match[0]);
        }
  
        if (Date.now() - start > timeout) {
          throw new Error('OTP not received within timeout ' + timeout + 'ms');
        }
  
        return cy.wait(interval).then(check);
      });
    }
  
    return check();
  }
  