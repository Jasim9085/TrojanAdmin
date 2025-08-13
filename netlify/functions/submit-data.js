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

    // Initialize the store manually with credentials
    const store = getStore({
        name: "device-feedback", // Use a consistent store name
        siteID: NETLIFY_SITE_ID,
        token: NETLIFY_ACCESS_TOKEN
    });

    // Create a unique key for each piece of data (e.g., "someID_battery_status")
    const key = `${deviceId}_${dataType}`;
    
    // Save the data under the specific key
    await store.setJSON(key, {
        dataType: dataType,
        payload: payload,
        timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data stored successfully." })
    };

  } catch (error) {
    console.error("Submit Data Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
