// netlify/functions/submit-data.js

const { getStore } = require("@netlify/blobs");

// Load secrets from environment variables
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
    
    // --- THIS IS THE CRITICAL CHANGE ---
    // We now store the payload DIRECTLY.
    // store.setJSON() is smart:
    // - If the payload is a JSON object (like battery status), it stores it as JSON.
    // - If the payload is a giant string (like a Base64 image), it stores it as a JSON string.
    // This makes it perfectly compatible with what get-status.js and the dashboard expect.
    await store.setJSON(key, payload);

    console.log(`[INFO] Successfully stored data for key: ${key}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data stored successfully." })
    };

  } catch (error) {
    // Provide more detailed logging for debugging
    console.error(`Submit Data Error for dataType '${event.body.dataType}':`, error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
