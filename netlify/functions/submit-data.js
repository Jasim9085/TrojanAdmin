// This function receives data FROM the Android device and saves it.
const { getStore } = require("@netlify/blobs");

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

    // Get the status store and save the entire data packet.
    // We will use the deviceId as the key for the blob.
    const statusStore = getStore("device-status");
    await statusStore.setJSON(deviceId, {
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
