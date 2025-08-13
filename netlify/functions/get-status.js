const { getStore } = require("@netlify/blobs");

// --- STEP 1: Load the required secrets from your environment variables ---
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

// --- STEP 2: Define all the data types we want to fetch for the panel ---
const DATA_TYPES_TO_FETCH = [
    "battery_status",
    "screen_status",
    "location",
    "current_app",
    "installed_apps",
    "accelerometer",
    "gyroscope",
    "magnetometer_compass",
    "proximity"
];

exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method NotAllowed' };
  }

  try {
    const deviceId = event.queryStringParameters.deviceId;
    if (!deviceId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing deviceId parameter.' }) };
    }

    // --- STEP 3: Initialize the store manually with credentials ---
    // It's critical this uses the same store name as your `submit-data.js` function.
    const store = getStore({
        name: "device-feedback", // Ensure this name matches the one in submit-data.js
        siteID: NETLIFY_SITE_ID,
        token: NETLIFY_ACCESS_TOKEN
    });
    
    const allDeviceData = {};

    // --- STEP 4: Loop through the data types and build the correct keys ---
    const promises = DATA_TYPES_TO_FETCH.map(async (dataType) => {
        // This creates the correct key (e.g., "someDeviceID_battery_status") to match the writer
        const key = `${deviceId}_${dataType}`;
        const data = await store.getJSON(key);
        // If data was found for that key, add it to our response object
        if (data) {
            allDeviceData[dataType] = data;
        }
    });

    // Wait for all the lookups to finish
    await Promise.all(promises);

    // Check if we found any data at all
    if (Object.keys(allDeviceData).length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'No data found for this device.' })};
    }

    // --- STEP 5: Return the combined object with all found data ---
    // The admin panel will receive an object like: { "battery_status": {...}, "location": {...} }
    return {
      statusCode: 200,
      body: JSON.stringify(allDeviceData)
    };

  } catch (error) {
    // This will also catch the "MissingBlobsEnvironmentError" if your variables are wrong
    console.error("Get Status Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
