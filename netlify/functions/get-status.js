//
// get-status.js (CORRECTED TO HANDLE RAW & JSON DATA)
//
const { getStore } = require("@netlify/blobs");

// Get the site credentials from the environment variables to ensure we use the correct store
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

// The full list of data types to fetch. This list is correct.
const ALL_DATA_TYPES = [
    // Core Device Status
    "battery_status", "screen_status", "location", "current_app", "installed_apps",
    // Raw Sensors
    "accelerometer", "gyroscope", "magnetometer",
    // Fused Orientation Sensors
    "gravity", "rotation_vector", "game_rotation_vector", "geomagnetic_rotation_vector",
    // Contextual Sensors
    "proximity", "light", "pressure", "pocket_mode", "face_up_down", "tilt_detector",
    // Media Payloads (Images & Audio)
    "screenshot", "picture", "last_recording"
];

exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { deviceId, type: requestedType } = event.queryStringParameters;
    
    if (!deviceId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing deviceId parameter.' }) };
    }

    // Explicitly provide the siteID and token to guarantee we access the correct blob store.
    const store = getStore({
        name: "device-feedback", 
        siteID: NETLIFY_SITE_ID,
        token: NETLIFY_ACCESS_TOKEN
    });
    
    const dataTypesToFetch = requestedType ? [requestedType] : ALL_DATA_TYPES;
    const allDeviceData = {};

    // --- THIS IS THE CRITICAL FIX ---
    // The logic inside this block now checks if the data type is a media file or a standard JSON object.
    const promises = dataTypesToFetch.map(async (dataType) => {
        const key = `${deviceId}_${dataType}`;
        try {
            // Check if the data type is one of our Base64-encoded files
            if (dataType === 'screenshot' || dataType === 'picture' || dataType === 'last_recording') {
                // If it's a file, get the raw string data. DO NOT parse as JSON.
                const data = await store.get(key);
                if (data) {
                    allDeviceData[dataType] = data;
                }
            } else {
                // For all other data types, get and parse them as JSON objects.
                const data = await store.get(key, { type: 'json' });
                if (data) {
                    allDeviceData[dataType] = data;
                }
            }
        } catch (error) {
            // This log is still useful for keys that genuinely don't exist yet.
            console.log(`Info: No data found for key '${key}'. This might be expected.`);
        }
    });

    await Promise.all(promises);

    if (Object.keys(allDeviceData).length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'No data found for this device.' })};
    }

    return {
      statusCode: 200,
      body: JSON.stringify(allDeviceData)
    };

  } catch (error) {
    console.error("Get Status Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
