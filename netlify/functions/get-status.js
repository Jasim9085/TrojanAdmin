const { getStore } = require("@netlify/blobs");

const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

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
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const deviceId = event.queryStringParameters.deviceId;
    if (!deviceId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing deviceId parameter.' }) };
    }

    const store = getStore({
        name: "device-feedback",
        siteID: NETLIFY_SITE_ID,
        token: NETLIFY_ACCESS_TOKEN
    });
    
    const allDeviceData = {};

    const promises = DATA_TYPES_TO_FETCH.map(async (dataType) => {
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

    return {
      statusCode: 200,
      body: JSON.stringify(allDeviceData)
    };

  } catch (error) {
    console.error("Get Status Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
