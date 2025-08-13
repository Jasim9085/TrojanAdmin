// This function handles registration from the Android app.
import { getStore } from "@netlify/blobs";

exports.handler = async function(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { deviceId, token } = data;

    if (!deviceId || !token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing deviceId or token' }) };
    }

    // Get a reference to our "devices" store
    const devicesStore = getStore("devices");
    
    // Save the token using the deviceId as the key
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