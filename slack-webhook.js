import fetch from 'node-fetch';

/**
 * Send test results to Slack using Incoming Webhook
 */
export async function sendSlackNotification(results, webhookUrl) {
  if (!webhookUrl || webhookUrl.includes('XXX/YYY/ZZZ')) {
    console.log('⚠️  Slack webhook not configured. Skipping notification.');
    return;
  }

  const totalTests = results.totalTests || 0;
  const passed = results.totalPassed || 0;
  const failed = results.totalFailed || 0;
  const skipped = results.totalSkipped || 0;
  const duration = Math.floor((results.totalDuration || 0) / 1000); // Convert to seconds
  
  const successRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(2) : 0;
  
  // Determine status
  let statusEmoji = '✅';
  let statusText = 'Passed';
  
  if (failed > 0) {
    statusEmoji = '❌';
    statusText = 'Failed';
  } else if (skipped > 0) {
    statusEmoji = '⚠️';
    statusText = 'Passed with Skipped';
  }

  // Create message text
  const messageText = `${statusEmoji} *Cypress Results – ${statusText}*\n\n` +
    `📊 *Total:* ${totalTests}\n` +
    `✅ *Passed:* ${passed}\n` +
    `❌ *Failed:* ${failed}\n` +
    `⏭️ *Skipped:* ${skipped}\n` +
    `📈 *Success Rate:* ${successRate}%\n` +
    `⏱️ *Duration:* ${duration}s`;

  const message = {
    username: 'StatementZen Cypress Bot',
    icon_emoji: ':robot_face:',
    text: messageText
  };

  try {
    console.log('\n📤 Sending Slack notification...');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      console.log('✅ Slack notification sent successfully!');
    } else {
      console.error('❌ Failed to send Slack notification:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error sending Slack notification:', error.message);
  }
}

