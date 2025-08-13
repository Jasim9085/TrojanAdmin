// Using the older 'require' syntax for maximum compatibility.
const { getStore } = require("@netlify/blobs");

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { deviceId, token } = data;

    if (!deviceId || !token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing deviceId or token' }) };
    }

    const devicesStore = getStore("devices");
    await devicesStore.set(deviceId, token);

    console.log(`Successfully registered device: ${deviceId}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Device ${deviceId} registered successfully.` })
    };

  } catch (error) {
    console.error("Registration Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
