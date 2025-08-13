// Using the older 'require' syntax for maximum compatibility.
const { getStore } = require("@netlify/blobs");
const admin = require("firebase-admin");

// --- CONFIGURATION ---
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// --- INITIALIZE FIREBASE ADMIN SDK ---
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)),
    });
  } catch(e){
    console.error("Firebase admin initialization error:", e);
  }
}

// --- MAIN SERVERLESS FUNCTION ---
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { deviceId, action, password } = data;

    if (password !== ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: Wrong API Password' }) };
    }
    
    if (!deviceId || !action) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing deviceId or action' }) };
    }

    const devicesStore = getStore("devices");
    const token = await devicesStore.get(deviceId);

    if (!token) {
      return { statusCode: 404, body: JSON.stringify({ error: `Device token not found for '${deviceId}' in the store.` }) };
    }

    await admin.messaging().send({
      token: token,
      data: { action: action }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Command '${action}' sent successfully!` })
    };

  } catch (error) {
    console.error("Send Command Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
