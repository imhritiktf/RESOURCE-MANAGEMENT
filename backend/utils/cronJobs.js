const cron = require("node-cron");
const Resource = require("../models/Request");
const Request = require("../models/Resource");

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running cron job to reset resource availability...");

    // Find requests that have ended
    const expiredRequests = await Request.find({
      status: "approved",
      endDate: { $lt: new Date() }, // Requests where the end date has passed
    });

    // Collect resource IDs that need to be marked available
    const resourceIds = expiredRequests.map((req) => req.resource);

    // Update resources to set availability = true
    await Resource.updateMany(
      { _id: { $in: resourceIds } },
      { availability: true }
    );

    console.log("Resource availability updated successfully.");
  } catch (error) {
    console.error("Error in cron job:", error.message);
  }
});
