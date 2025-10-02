const { getLatestOtp } = require('./gmail');

async function testOtp() {
  try {
    const otp = await getLatestOtp({ timeout: 120000, pollInterval: 5000 });
    console.log('Fetched OTP:', otp);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOtp();