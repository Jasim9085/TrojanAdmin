//
// get-status.js (UPGRADED FOR NEW MEDIA TYPES & EFFICIENCY)
//
const { getStore } = require("@netlify/blobs");

const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

// The full list of data types to fetch when a general refresh is requested.
const ALL_DATA_TYPES = [
    // Core Device Status
    "battery_status",
    "screen_status",
    "location",
    "current_app",
    "installed_apps",

    // Raw Sensors (Tier 3 Fallback)
    "accelerometer",
    "gyroscope",
    "magnetometer",

    // Fused Orientation Sensors (Tier 1 & 2)
    "gravity",
    "rotation_vector",
    "game_rotation_vector",
    "geomagnetic_rotation_vector",
    
    // Contextual Sensors (Tier 1 & 2)
    "proximity",
    "light",
    "pressure",
    "pocket_mode",
    "face_up_down",
    "tilt_detector",

    // --- NEW: Media Payloads ---
    "screenshot",
    "picture",
    "last_recording"
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

    const store = getStore({
        name: "device-feedback", 
        siteID: NETLIFY_SITE_ID,
        token: NETLIFY_ACCESS_TOKEN
    });
    
    // --- UPGRADE: Determine which data types to fetch ---
    // If a specific 'type' is requested (e.g., 'installed_apps'), only fetch that.
    // Otherwise, fetch the entire list for a full refresh.
    const dataTypesToFetch = requestedType ? [requestedType] : ALL_DATA_TYPES;
    
    const allDeviceData = {};

    const promises = dataTypesToFetch.map(async (dataType) => {
        const key = `${deviceId}_${dataType}`;
        try {
            const data = await store.get(key, { type: 'json' });
            if (data) {
                allDeviceData[dataType] = data;
            }
        } catch (error) {
            // It's common for a key not to be found, so we log it but don't fail the whole request.
            // This can happen if, for example, a screenshot has never been taken.
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
