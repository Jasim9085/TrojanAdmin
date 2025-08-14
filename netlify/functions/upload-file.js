// netlify/functions/upload-file.js
const { getStore } = require("@netlify/blobs");

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { deviceId, dataType, fileData } = JSON.parse(event.body);

    if (!deviceId || !dataType || !fileData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: deviceId, dataType, or fileData.' }) };
    }

    const store = getStore("device-feedback");
    const key = `${deviceId}_${dataType}`; // e.g., "some-id_screenshot"

    // Store the Base64 string directly.
    // The `set` method automatically handles large data.
    await store.set(key, fileData);

    console.log(`[INFO] Successfully stored ${dataType} for deviceId: ${deviceId}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `${dataType} uploaded successfully.` })
    };

  } catch (error) {
    console.error("Upload File Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
