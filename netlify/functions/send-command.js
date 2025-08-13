// This file is netlify/functions/send-command.js
const admin = require('firebase-admin');

// IMPORTANT: These values will be set in the Netlify UI, not stored in code.
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)),
      databaseURL: FIREBASE_DATABASE_URL,
    });
  } catch(e){
    console.error("Firebase admin initialization error", e);
  }
}

// This is the main function that Netlify will run.
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  const data = JSON.parse(event.body);
  if (data.password !== ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: Wrong API Password' }) };
  }
  try {
    const tokenRef = admin.database().ref(`devices/${data.deviceId}/token`);
    const snapshot = await tokenRef.once('value');
    const token = snapshot.val();
    if (!token) {
      return { statusCode: 404, body: JSON.stringify({ error: `Device token not found for ${data.deviceId}` }) };
    }
    await admin.messaging().send({
      token: token,
      data: { action: data.action }
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Command '${data.action}' sent successfully!` })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
