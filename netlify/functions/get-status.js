//
// get-status.js (CORRECT AND FINAL VERSION)
//
const { getStore } = require("@netlify/blobs");

// Load secrets from environment variables
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

// This array tells the function exactly which pieces of data to look for
const DATA_TYPES_TO_FETCH = [
    "battery_status",
    "screen_status",
    "location",
    "current_app",
    "installed_apps", // This was missing from your old variable
    "accelerometer",
    "gyroscope",
    "magnetometer_compass",
    "proximity"
];

exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const deviceId = event.queryStringParameters.deviceId;
    if (!deviceId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing deviceId parameter.' }) };
    }

    // Initialize the store with credentials.
    // The store name MUST match the one used in your submit-data.js function.
    const store = getStore({
        name: "device-feedback", // Or "device-status" if that's what you used
        siteID: NETLIFY_SITE_ID,
        token: NETLIFY_ACCESS_TOKEN
    });
    
    const allDeviceData = {};

    // Loop through our list of data types and try to fetch each one
    const promises = DATA_TYPES_TO_FETCH.map(async (dataType) => {
        // Build the correct key (e.g., "someDeviceID_battery_status")
        const key = `${deviceId}_${dataType}`;
        const data = await store.getJSON(key);
        if (data) {
            allDeviceData[dataType] = data;
        }
    });

    await Promise.all(promises);

    if (Object.keys(allDeviceData).length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'No data found for this device.' })};
    }

    // Return a single JSON object containing all the data we found
    return {
      statusCode: 200,
      body: JSON.stringify(allDeviceData)
    };

  } catch (error) {
    console.error("Get Status Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
