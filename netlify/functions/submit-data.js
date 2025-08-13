// This function receives data FROM the Android device and saves it.
const { getStore } = require("@netlify/blobs");

// --- STEP 1: Load the required secrets from your Netlify environment variables ---
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { deviceId, dataType, payload } = data;

    if (!deviceId || !dataType || payload === undefined) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required data fields.' }) };
    }

    // --- STEP 2: Manually initialize the blob store with credentials ---
    // This is the critical fix that resolves the MissingBlobsEnvironmentError.
    const statusStore = getStore({
        name: "device-status", // Using the store name from your original code
        siteID: NETLIFY_SITE_ID,
        token: NETLIFY_ACCESS_TOKEN
    });

    // We will save the data under a key that combines the deviceId and dataType.
    // This prevents different data types from overwriting each other for the same device.
    const key = `${deviceId}_${dataType}`;
    
    await statusStore.setJSON(key, {
        dataType: dataType,
        payload: payload,
        timestamp: new Date().toISOString()
    });

    console.log(`Successfully stored data for key: ${key}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data stored successfully." })
    };

  } catch (error) {
    console.error("Submit Data Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
