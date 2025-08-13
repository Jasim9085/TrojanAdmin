const { getStore } = require("@netlify/blobs");
const admin = require("firebase-admin");

// Get all required secrets from the environment
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)),
    });
  } catch(e) { console.error("Firebase init error:", e); }
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const data = JSON.parse(event.body);
    if (data.password !== ADMIN_PASSWORD) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

    // THIS IS THE CRITICAL CHANGE: Manually configure the store
    const devicesStore = getStore({
        name: "devices",
        siteID: NETLIFY_SITE_ID,
        token: NETLIFY_ACCESS_TOKEN
    });

    const token = await devicesStore.get(data.deviceId);
    if (!token) return { statusCode: 404, body: JSON.stringify({ error: `Device not found` }) };

    await admin.messaging().send({ token: token, data: { action: data.action } });
    return { statusCode: 200, body: JSON.stringify({ message: 'Command sent!' }) };

  } catch (error) {
    console.error("Function Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
