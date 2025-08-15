// netlify/functions/submit-data.js

const { getStore } = require("@netlify/blobs");

const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { deviceId, dataType, payload } = JSON.parse(event.body);

    if (!deviceId || !dataType || payload === undefined) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required data fields.' }) };
    }

    const store = getStore({
        name: "device-feedback",
        siteID: NETLIFY_SITE_ID,
        token: NETLIFY_ACCESS_TOKEN
    });

    const key = `${deviceId}_${dataType}`;

    // CRITICAL: Store the raw payload directly. setJSON handles both objects and strings correctly.
    await store.setJSON(key, payload);

    console.log(`[SUCCESS] Stored data for key: ${key}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data stored successfully." })
    };

  } catch (error) {
    console.error(`[ERROR] Failed to store data. Key: ${event.body ? `${event.body.deviceId}_${event.body.dataType}` : 'Unknown'}. Error: ${error.message}`);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
