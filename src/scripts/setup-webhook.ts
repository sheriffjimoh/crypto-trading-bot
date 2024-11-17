import axios from 'axios';

async function setupWebhook() {
  const token = process.env.TELEGRAM_TOKEN;
  const url = process.env.VERCEL_URL;

  if (!token || !url) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  try {
    // Remove any existing webhook
    await axios.get(`https://api.telegram.org/bot${token}/deleteWebhook`);

    // Set new webhook
    const response = await axios.get(`https://api.telegram.org/bot${token}/setWebhook`, {
      params: {
        url: `${url}/api/telegram`,
        allowed_updates: ['message']
      }
    });

    console.log('Webhook setup response:', response.data);
  } catch (error) {
    console.error('Error setting up webhook:', error);
  }
}

setupWebhook();