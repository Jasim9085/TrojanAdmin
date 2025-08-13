// This is the updated netlify/functions/send-command.js
// It uses Netlify Blobs for storage, not Firebase Database.
import { getStore } from "@netlify/blobs";
import admin from "firebase-admin";

// --- CONFIGURATION ---
// These are the two secret variables you set in the Netlify UI.
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// --- INITIALIZE FIREBASE ADMIN SDK ---
// We only need the service account to send FCM messages. No databaseURL is needed.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)),
    });
    console.log("Firebase Admin SDK for messaging initialized.");
  } catch(e){
    console.error("Firebase admin initialization error:", e);
  }
}

// --- MAIN SERVERLESS FUNCTION ---
exports.handler = async function(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { deviceId, action, password } = data;

    // 1. Authenticate the admin's request
    if (password !== ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: Wrong API Password' }) };
    }
    
    if (!deviceId || !action) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing deviceId or action' }) };
    }

    // 2. Get the device token from Netlify's own storage
    const devicesStore = getStore("devices"); // The store name we chose earlier
    const token = await devicesStore.get(deviceId); // Fetch token by its key (the deviceId)

    if (!token) {
      return { statusCode: 404, body: JSON.stringify({ error: `Device token not found for '${deviceId}' in the store.` }) };
    }

    // 3. Send the command using FCM
    await admin.messaging().send({
      token: token,
      data: { action: action }
    });

    // 4. Return a success message
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
