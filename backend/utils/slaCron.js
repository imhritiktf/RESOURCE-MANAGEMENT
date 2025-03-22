const cron = require("node-cron");
const Request = require("../models/Request");
const Resource = require("../models/Resource");

const checkSLABreach = async () => {
  try {
    const now = new Date();

    // Find the smallest SLA time among all resources
    const resources = await Resource.find({});
    const smallestSLATime = Math.min(...resources.map(resource => resource.slaTime || 2880)); // Default to 48 hours if not set

    // Convert smallest SLA time to milliseconds
    const slaLimit = smallestSLATime * 60 * 1000;

    // Find pending requests that have breached SLA
    const breachedRequests = await Request.find({
      status: "pending",
      $or: [
        { createdAt: { $lt: new Date(now - slaLimit) } }, // More than SLA time old
        { requestedDate: { $lt: now } }, // Event date has already passed
      ],
      "slaBreached.isBreached": false, // Only update if not already breached
    });

    if (breachedRequests.length > 0) {
      await Request.updateMany(
        { _id: { $in: breachedRequests.map(req => req._id) } },
        {
          $set: {
            "slaBreached.isBreached": true,
            "slaBreached.breachedAt": now,
            "slaBreached.reason": "48HoursExceeded", // or "eventDatePassed"
            inactiveStatus: true, // Mark as inactive
          },
        }
      );
      console.log(`${breachedRequests.length} requests marked as SLA breached and inactive.`);
    }
  } catch (error) {
    console.error("Error checking SLA breach:", error);
  }
};

// Schedule the cron job to run every 15 minutes (or the smallest SLA time)
cron.schedule("*/15 * * * *", checkSLABreach);

module.exports = checkSLABreach;