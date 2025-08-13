
// This function is called BY the admin panel to retrieve the latest data.
const { getStore } = require("@netlify/blobs");

exports.handler = async function(event) {
    // We expect the deviceId to be passed as a query parameter, e.g., /get-status?deviceId=...
    const deviceId = event.queryStringParameters.deviceId;

    if (!deviceId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'deviceId query parameter is required.' }) };
    }

    try {
        const statusStore = getStore("device-status");
        const latestStatus = await statusStore.get(deviceId, { type: "json" });

        if (!latestStatus) {
            return { statusCode: 404, body: JSON.stringify({ message: 'No status found for this device yet.' }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(latestStatus)
        };
    } catch (error) {
        console.error("Get Status Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
