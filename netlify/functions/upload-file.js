// netlify/functions/upload-file.js

const { getStore } = require("@netlify/blobs");

// --- THIS IS THE CRITICAL FIX ---
// Get the site credentials from the environment variables that Netlify provides.
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { deviceId, dataType, fileData } = JSON.parse(event.body);

    if (!deviceId || !dataType || !fileData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: deviceId, dataType, or fileData.' }) };
    }

    // --- THIS IS THE CORRECTED LOGIC ---
    // Explicitly provide the siteID and token when getting the store.
    const store = getStore({
        name: "device-feedback",
        siteID: NETLIFY_SITE_ID,
        token: NETLIFY_ACCESS_TOKEN
    });
    
    const key = `${deviceId}_${dataType}`;

    await store.set(key, fileData);

    console.log(`[INFO] Successfully stored ${dataType} for deviceId: ${deviceId}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `${dataType} uploaded successfully.` })
    };

  } catch (error) {
    // This will now log more helpful details if the token/ID are wrong
    console.error("Upload File Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
