const { getStore } = require("@netlify/blobs");

// Get the secrets needed for blob storage
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const data = JSON.parse(event.body);
    const { deviceId, token } = data;
    if (!deviceId || !token) return { statusCode: 400, body: JSON.stringify({ error: 'Missing data' }) };

    // THIS IS THE CRITICAL CHANGE: Manually configure the store
    const devicesStore = getStore({
        name: "devices",
        siteID: NETLIFY_SITE_ID,
        token: NETLIFY_ACCESS_TOKEN
    });

    await devicesStore.set(deviceId, token);
    return { statusCode: 200, body: JSON.stringify({ message: 'Device registered' }) };

  } catch (error) {
    console.error("Registration Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
