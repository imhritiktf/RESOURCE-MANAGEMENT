const cron = require("node-cron");
const Request = require("../models/Request");
const Resource = require("../models/Resource");

const checkSLABreach = async () => {
  try {
    const now = new Date();
    console.log(`Checking SLA breaches at ${now.toISOString()}`);

    // Find pending requests that might have breached SLA
    const breachedRequests = await Request.find({
      status: "pending",
      "slaBreached.isBreached": false, // Only update if not already breached
    }).populate("resource", "slaTime");

    console.log(`Found ${breachedRequests.length} pending requests to check.`);

    if (breachedRequests.length === 0) {
      console.log("No pending requests to process.");
      return;
    }

    const updates = breachedRequests
      .map((req) => {
        const slaTime = req.resource?.slaTime || 2880; // Default to 48 hours (2880 minutes)
        const slaLimit = slaTime * 60 * 1000; // Convert minutes to milliseconds
        const timeSinceCreation = now - new Date(req.createdAt); // Time elapsed since creation

        console.log(
          `Request ${req._id}: createdAt=${req.createdAt}, slaTime=${slaTime} minutes, timeSinceCreation=${timeSinceCreation / (60 * 1000)} minutes`
        );

        // Check if SLA time has been exceeded based on createdAt
        if (timeSinceCreation > slaLimit) {
          return {
            updateOne: {
              filter: { _id: req._id },
              update: {
                $set: {
                  "slaBreached.isBreached": true,
                  "slaBreached.breachedAt": now,
                  "slaBreached.reason": "slaTimeExceeded",
                  inactiveStatus: true,
                },
              },
            },
          };
        }
        return null; // No breach yet
      })
      .filter((update) => update !== null);

    if (updates.length > 0) {
      await Request.bulkWrite(updates);
      console.log(`${updates.length} requests marked as SLA breached and inactive.`);
    } else {
      console.log("No SLA breaches detected.");
    }
  } catch (error) {
    console.error("Error checking SLA breach:", error.message, error.stack);
  }
};

// Schedule the cron job with a fixed, frequent interval
const scheduleSLACheck = async () => {
  try {
    // Fetch all resources to log the smallest SLA time (for reference)
    const resources = await Resource.find({}, "slaTime");
    const slaTimes = resources.map((resource) => resource.slaTime || 2880); // Default to 48 hours
    const smallestSLATime = Math.min(...slaTimes);
    console.log(`Smallest SLA time found: ${smallestSLATime} minutes`);

    // Use a fixed interval (e.g., every 5 minutes) for frequent checks
    const checkInterval = 5; // Check every 5 minutes
    const cronExpression = `*/${checkInterval} * * * *`;
    console.log(`Scheduling SLA breach check every ${checkInterval} minute(s)`);

    // Schedule the job
    cron.schedule(cronExpression, checkSLABreach);
  } catch (error) {
    console.error("Error scheduling SLA breach check:", error.message, error.stack);
    // Fallback to every 5 minutes
    const fallbackInterval = 5;
    cron.schedule(`*/${fallbackInterval} * * * *`, checkSLABreach);
    console.log(`Falling back to ${fallbackInterval}-minute interval due to error.`);
  }
};

// Run the scheduler on startup
scheduleSLACheck();

// Export for testing or manual runs
module.exports = { checkSLABreach, scheduleSLACheck };