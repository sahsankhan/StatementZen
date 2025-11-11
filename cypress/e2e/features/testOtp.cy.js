// cypress/e2e/testOtp.cy.js
import { fetchOtpFromTempSms } from '../../support/tempsms';

describe('Temp SMS OTP Fetch Test', () => {
  it('fetches OTP from temp SMS site', () => {
    const SMS_PAGE = 'https://receive-sms.cc/US-Phone-Number/16125626619';

    fetchOtpFromTempSms(SMS_PAGE).then((otp) => {
      cy.log('OTP fetched: ' + otp);
      expect(otp).to.match(/\d{4,6}/); // basic check
    });
  });
});
