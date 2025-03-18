const cron = require("node-cron");
const Request = require("../models/Request");

const checkSLABreach = async () => {
  try {
    const now = new Date();
    const slaLimit = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

    // Find pending requests that have breached SLA
    const breachedRequests = await Request.find({
      status: "pending",
      $or: [
        { createdAt: { $lt: new Date(now - slaLimit) } }, // More than 48 hours old
        { requestedDate: { $lt: now } } // Event date has already passed
      ],
      slaBreached: false // Only update if not already breached
    });

    if (breachedRequests.length > 0) {
      await Request.updateMany(
        { _id: { $in: breachedRequests.map(req => req._id) } },
        { $set: { slaBreached: true } }
      );
      console.log(`${breachedRequests.length} requests marked as SLA breached.`);
    }
  } catch (error) {
    console.error("Error checking SLA breach:", error);
  }
};

// Schedule the cron job to run every hour
cron.schedule("0 * * * *", checkSLABreach);

module.exports = checkSLABreach;
