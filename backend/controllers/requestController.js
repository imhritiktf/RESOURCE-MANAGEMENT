const Request = require("../models/Request");
const Resource = require("../models/Resource");
const RequestLog = require("../models/RequestLog");
const ResourceUsageLog = require("../models/ResourceUsageLog");
const ApprovalLog = require("../models/ApprovalLog");
const axios = require("axios");

// Create a new resource request
exports.createRequest = async (req, res) => {
  try {
    const {
      resource,
      eventDetails,
      requestedDate,
      durationDays,
      priority,
    } = req.body;

    // Only check fields that are actually required and not overridden
    if (
      !resource ||
      !eventDetails ||
      !requestedDate ||
      !durationDays
    ) {
      return res.status(400).json({ message: "Resource, event details, requested date, and duration are required" });
    }

    const resourceExists = await Resource.findById(resource);
    if (!resourceExists) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const newRequest = new Request({
      faculty: req.user._id,
      resource,
      eventDetails,
      requestedDate,
      durationDays,
      priority,
      organization: req.user.organization, // Use from token, not req.body
    });

    await newRequest.save();

    res
      .status(201)
      .json({ message: "Request submitted successfully", request: newRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    let query = {}; // Default: Trustees see all requests
    const {
      status,
      priority,
      organization,
      startDate,
      endDate,
      lastMonth,
      sortBy,
      limit = 10,
      page = 1,
      facultyName,
      resourceName,
    } = req.query;

    // 🟠 **Filter: Supervisors See Only Assigned Resources**
    if (req.user.role === "supervisor") {
      const assignedResourceIds = req.user.assignedResources.map((r) =>
        r._id.toString()
      );
      query.resource = { $in: assignedResourceIds };
    }

    // 🟠 **Filter: Status**
    if (status) query.status = status;

    // 🟠 **Filter: Priority**
    if (priority) query.priority = priority;

    // 🟠 **Filter: Organization**
    if (organization) query.organization = organization;

    // 🟠 **Filter: Start & End Date**
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 🟠 **Filter: Last Month**
    if (lastMonth) {
      const now = new Date();
      const firstDayOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      query.createdAt = { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth };
    }

    // 🟠 **Search: Faculty Name & Resource Name**
    let facultyQuery = {};
    let resourceQuery = {};
    if (facultyName)
      facultyQuery = { name: { $regex: facultyName, $options: "i" } };
    if (resourceName)
      resourceQuery = { name: { $regex: resourceName, $options: "i" } };

    // 🟠 **Sorting Options**
    let sortOptions = { createdAt: -1 }; // Default: Newest First
    if (sortBy === "status") sortOptions = { status: 1 };
    if (sortBy === "priority") sortOptions = { priority: -1 }; // Urgent First

    // 🟠 **Pagination**
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // 🟠 **Get Total Count Before Fetching Requests**
    const totalRequests = await Request.countDocuments(query);
    const totalPages = Math.ceil(totalRequests / limitNum);

    // 🟠 **Fetch Requests**
    const requests = await Request.find(query)
      .populate({ path: "faculty", match: facultyQuery, select: "name email" })
      .populate({
        path: "resource",
        match: resourceQuery,
        select: "name slaTime",
      })
      .populate("approvedBy", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Filter out requests where `populate` didn't match the search criteria
    const filteredRequests = requests.filter(
      (req) => req.faculty && req.resource
    );

    res.json({
      requests: filteredRequests,
      totalRequests,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};  

exports.getFacultyRequests = async (req, res) => {
  try {
    const {
      status,
      priority,
      organization,
      startDate,
      endDate,
      lastMonth,
      sortBy,
      limit = 10,
      page = 1,
    } = req.query;
    let filterOptions = { faculty: req.user._id }; // Default: fetch only faculty's requests

    // Add filters (status, priority, organization, date range, etc.)
    if (status) filterOptions.status = status;
    if (priority) filterOptions.priority = priority;
    if (organization) filterOptions.organization = organization;
    if (startDate || endDate) {
      filterOptions.createdAt = {};
      if (startDate) filterOptions.createdAt.$gte = new Date(startDate);
      if (endDate) filterOptions.createdAt.$lte = new Date(endDate);
    }
    if (lastMonth) {
      const now = new Date();
      const firstDayOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      filterOptions.createdAt = {
        $gte: firstDayOfLastMonth,
        $lte: lastDayOfLastMonth,
      };
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sortBy === "status") sortOptions = { status: 1 };
    if (sortBy === "priority") sortOptions = { priority: -1 }; // Urgent first

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Fetch requests
    const requests = await Request.find(filterOptions)
      .populate("resource", "name slaTime organization")
      .populate("approvedBy", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

      // const requests = await Request.find(query)
      // .populate({ path: "faculty", match: facultyQuery, select: "name email" })
      // .populate({
      //   path: "resource",
      //   match: resourceQuery,
      //   select: "name slaTime",
      // })
      // .populate("approvedBy", "name")
      // .sort(sortOptions)
      // .skip(skip)
      // .limit(limitNum);

    // Get total count for pagination
    const totalRequests = await Request.countDocuments(filterOptions);
    const totalPages = Math.ceil(totalRequests / limitNum);

    // Return response
    res.json({
      requests: requests || [], // Ensure `requests` is always an array
      totalRequests,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// get request logd
exports.getRequestLog = async (req, res) => {
  try {
    const { role, userId } = req.query; // Get role and userId from query params
    let filter = {};

    if (role === "faculty") {
      // Faculty can only see logs of their own requests
      const facultyRequests = await Request.find({ faculty: userId }).select("_id");

      // Extract the request IDs
      const requestIds = facultyRequests.map(request => request._id);

      // Filter approval logs by these request IDs
      filter["request"] = { $in: requestIds };
    } else if (role === "supervisor") {
      // Supervisors can only see logs of requests related to their assigned resources
      const user = await User.findById(userId); // Fetch the supervisor's details
      if (user && user.assignedResources) {
        filter["request.resource"] = { $in: user.assignedResources };
      }
    }
    // Trustees can see all logs, so no need to modify filter


    const logs = await ApprovalLog.find(filter)
      .populate({
        path: "request",
        select: "eventDetails requestedDate faculty rejectionReason",
        populate: {
          path: "faculty",
          select: "name email department", // Adjust fields as needed
        },
      })
      .populate("actionBy", "name email role")
      .sort({ timestamp: -1 });


    res.json(logs);
  } catch (error) {
    console.error("Error:", error); // Debugging
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// controllers/facultyLogController.js
exports.getFacultyLogs = async (req, res) => {
  try {
    const { userId } = req.query;

    // Disable caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const facultyRequests = await Request.find({ faculty: userId }).select("_id");
    const requestIds = facultyRequests.map(request => request._id);

    const logs = await ApprovalLog.find({ request: { $in: requestIds } })
      .populate({
        path: "request",
        select: "eventDetails requestedDate faculty rejectionReason durationDays",
        populate: [
          {
            path: "resource",
            select: "name",
          },
          {
            path: "faculty",
            select: "name email department",
          }
        ]
        
      })
      .populate("actionBy", "name email role")
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching faculty logs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// controllers/trusteeLogController.js
exports.getTrusteeLogs = async (req, res) => {
  try {
    // Disable caching (already present, keeping for consistency)
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const logs = await ApprovalLog.find()
      .populate({
        path: "request",
        select: "eventDetails requestedDate faculty rejectionReason durationDays",
        populate: [
          {
            path: "resource",
            select: "name",
          },
          {
            path: "faculty",
            select: "name email department",
          }
        ]
      })
      .populate("actionBy", "name email role")
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching trustee logs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// controllers/supervisorLogController.js
exports.getSupervisorLogs = async (req, res) => {
  try {
    const { userId } = req.query;

    // Disable caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const user = await User.findById(userId);
    if (!user || !user.assignedResources) {
      return res.status(404).json({ message: "Supervisor not found or no assigned resources" });
    }

    const logs = await ApprovalLog.find({ "request.resource": { $in: user.assignedResources } })
      .populate({
        path: "request",
        select: "eventDetails requestedDate faculty rejectionReason durationDays",
        populate: [
          {
            path: "resource",
            select: "name",
          },
          {
            path: "faculty",
            select: "name email department",
          }
        ]

      })
      .populate("actionBy", "name email role")
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching supervisor logs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getRequestCountByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const count = await Request.countDocuments({ status });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a Request (Only before approval)
exports.deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Approved or rejected requests cannot be deleted" });
    }

    await request.deleteOne();
    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getRequestLogByRequestId = async (req, res) => {
  try {
    const { requestId } = req.params;

    const logs = await RequestLog.find({ request: requestId })
      .populate({
        path: "request",
        select: "eventDetails requestedDate status faculty resource",
        populate: { path: "faculty", select: "name email" }, // To get faculty details
      })
      .populate("performedBy", "name email role")
      .sort({ timestamp: -1 });

    if (!logs.length) {
      return res
        .status(404)
        .json({ message: "No logs found for this request" });
    }

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const detectAnomaly = async (time) => {
  try {
    console.log("Sending POST request to /detect-anomaly with data:", {
      times: [time],
    });
    const response = await axios.post("http://localhost:5001/detect-anomaly", {
      times: [time], // Send the time as an array
    });
    console.log("Received response from Flask API:", response.data);
    return {
      isAnomaly: response.data.predictions[0] === -1, // -1 = anomaly, 1 = normal
      mlScore: response.data.scores[0], // Confidence score
    };
  } catch (error) {
    console.error("Error calling ML API:", error);
    throw error;
  }
};


exports.updateRequestStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const request = await Request.findById(req.params.id)
      .populate("faculty", "organization")
      .populate("resource", "slaTime");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if the user is an approver (supervisor or trustee)
    if (!["supervisor", "trustee"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only supervisors or trustees can approve or reject requests.",
      });
    }

    // Check if the status is valid (approved or rejected)
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Only 'approved' or 'rejected' are allowed.",
      });
    }

    const now = new Date();
    const eventDateStart = new Date(request.requestedDate.setHours(0, 0, 0, 0)); // Start of event day
    const todayStart = new Date(now.setHours(0, 0, 0, 0)); // Start of today

    // Check if the event date has passed (only reject after the event day, not on it)
    if (todayStart > eventDateStart && request.status !== "rejected") {
      request.status = "rejected";
      request.rejectionReason = "Event date has passed";
      request.slaBreached.isBreached = true;
      request.slaBreached.breachedAt = now;
      request.slaBreached.reason = "eventDatePassed";

      await request.save();

      // Log the auto-rejection (actionBy is null for system action)
      const autoRejectLog = new ApprovalLog({
        request: request._id,
        actionBy: null, // System-driven, no user
        action: "rejected",
        reason: "Event date has passed",
        timestamp: now,
      });
      await autoRejectLog.save();

      return res.json({
        message: "Request rejected automatically as the event date has passed.",
      });
    }

    // 🚨 Suspicious Activity Detection
    const timeSinceRequest = (now - request.createdAt) / 1000; // Convert to seconds
    let suspiciousActivity = request.suspiciousActivity || [];

    // Rule 1: Too Fast Approval/Rejection (within 60 seconds)
    if (timeSinceRequest < 60) {
      suspiciousActivity.push({
        type: "tooFast",
        actionType: status === "approved" ? "approval" : "rejection",
        detectedAt: now,
        details: `${status === "approved" ? "Approved" : "Rejected"} within 1 minute`,
      });
    }

    // Rule 2: Too Late Approval/Rejection (after requested date)
    if (request.requestedDate < now) {
      suspiciousActivity.push({
        type: "tooLate",
        actionType: status === "approved" ? "approval" : "rejection",
        detectedAt: now,
        details: `${status === "approved" ? "Approved" : "Rejected"} after event date`,
      });
    }

    // ML-Based Anomaly Detection (assuming detectAnomaly is defined)
    const { isAnomaly, mlScore } = await detectAnomaly(timeSinceRequest);
    if (isAnomaly) {
      suspiciousActivity.push({
        type: "anomaly",
        actionType: status === "approved" ? "approval" : "rejection",
        detectedAt: now,
        details: "Unusual approval/rejection time detected",
        mlScore,
      });
    }

    // Set isSuspicious flag
    if (suspiciousActivity.length > 0) {
      request.isSuspicious = true;
    }

    // ✅ Update Request
    request.status = status;
    request.approvedBy = req.user._id;
    request.approvalTime = now;
    request.suspiciousActivity = suspiciousActivity;
    request.lastUpdatedBy = req.user._id;

    if (status === "rejected") {
      request.rejectionReason = rejectionReason || "No reason provided";
    } else {
      request.rejectionReason = undefined;
    }

    // Handle SLA Breach
    const slaTime = request.resource?.slaTime || 2880; // Default to 48 hours (2880 minutes)
    const slaLimit = slaTime * 60 * 1000; // Convert to milliseconds

    // Fix invalid slaBreached.reason (safety check)
    if (
      request.slaBreached.reason &&
      typeof request.slaBreached.reason !== "string" &&
      typeof request.slaBreached.reason !== "undefined"
    ) {
      request.slaBreached.reason =
        request.requestedDate < now ? "eventDatePassed" : "slaTimeExceeded";
    }

    // Check for SLA breach if not already marked
    if (!request.slaBreached.isBreached) {
      if (request.createdAt < new Date(now - slaLimit)) {
        request.slaBreached.isBreached = true;
        request.slaBreached.breachedAt = now;
        request.slaBreached.reason = "slaTimeExceeded";
      }
    }

    // Resolve SLA breach if it exists
    if (request.slaBreached.isBreached && !request.slaBreached.resolved) {
      request.slaBreached.resolved = true;
      request.slaBreached.resolvedAt = now;
      request.slaBreached.resolvedBy = req.user._id;
    }

    await request.save();

    // Log Approval/Rejection (always log, even if status doesn’t change)
    const logEntry = new ApprovalLog({
      request: request._id,
      actionBy: req.user._id,
      action: status,
      reason: status === "rejected" ? rejectionReason || "No reason provided" : undefined,
      timestamp: now,
    });
    await logEntry.save();

    // Log Resource Usage (if approved)
    if (status === "approved") {
      const bookingStart = request.requestedDate;
      const bookingEnd = new Date(
        bookingStart.getTime() + request.durationDays * 24 * 60 * 60 * 1000
      );
      const usageLog = new ResourceUsageLog({
        resource: request.resource,
        faculty: request.faculty,
        organization: request.organization,
        bookingStart,
        bookingEnd,
        durationDays: request.durationDays,
      });
      await usageLog.save();
    }

    res.json({
      message: `Request ${status} successfully`,
      request,
      suspiciousActivity,
    });
  } catch (error) {
    console.error("Error in updateRequestStatus:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.resubmitRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("faculty", "organization")
      .populate("resource", "slaTime");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if the user is a faculty (requester)
    if (req.user.role !== "faculty") {
      return res
        .status(403)
        .json({ message: "Only faculty can resubmit requests." });
    }

    // Check if the request is inactive
    if (!request.inactiveStatus) {
      return res
        .status(400)
        .json({ message: "Only inactive requests can be resubmitted." });
    }

    // Check if the event date has passed
    const now = new Date();
    if (request.requestedDate < now) {
      request.status = "rejected";
      request.rejectionReason = "Event date has passed";
      await request.save();
      return res.json({
        message: "Request rejected automatically as the event date has passed.",
      });
    }

    // Handle resubmission
    request.inactiveStatus = false; // Mark the request as active
    request.status = "pending"; // Set status to pending
    request.modifiedAt = new Date();
    request.modifiedCount += 1;
    request.slaBreached = {
      isBreached: false,
      breachedAt: null,
      reason: null,
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
    };

    await request.save();

    res.json({ message: "Request resubmitted successfully.", request });
  } catch (error) {
    console.error("Error in resubmitRequest:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getSlaBreachedRequests = async (req, res) => {
  try {
    // Ensure only trustees can access this
    if (req.user.role !== "trustee") {
      return res.status(403).json({
        message: "Access denied! Only trustees can view SLA-breached requests.",
      });
    }

    const { organization, startDate, endDate, slaTime } = req.query;

    // Match stage for filtering
    const match = { "slaBreached.isBreached": true };
    if (organization) match.organization = organization;

    // Add date range filter if startDate and endDate are provided
    if (startDate && endDate) {
      match["slaBreached.breachedAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      match["slaBreached.breachedAt"] = { $gte: new Date(startDate) };
    } else if (endDate) {
      match["slaBreached.breachedAt"] = { $lte: new Date(endDate) };
    }

    // Fetch all SLA breaches (both pending and resolved)
    const logs = await Request.find(match)
      .populate("faculty", "name email department")
      .populate("resource", "name organization slaTime") // Include slaTime from Resource
      .select(
        "_id faculty resource slaBreached inactiveStatus modifiedAt modifiedCount"
      );

    // Format logs and handle null values
    const formattedLogs = logs.map((log) => ({
      requestId: log._id,
      facultyName: log.faculty ? log.faculty.name : "Unknown Faculty",
      resourceName: log.resource ? log.resource.name : "Unknown Resource",
      slaTime: log.resource ? log.resource.slaTime : 2880, // Default to 48 hours if not set
      breachedAt: log.slaBreached.breachedAt,
      resolvedAt: log.slaBreached.resolvedAt,
      reason: log.slaBreached.reason,
      resolved: log.slaBreached.resolved,
      inactiveStatus: log.inactiveStatus, // Include inactive status
      modifiedAt: log.modifiedAt, // Include last modified timestamp
      modifiedCount: log.modifiedCount, // Include modification count
    }));

    // Separate pending and resolved breaches
    const pendingBreaches = formattedLogs.filter((log) => !log.resolved);
    const resolvedBreaches = formattedLogs.filter((log) => log.resolved);

    // Fetch SLA breach trends
    const trends = await Request.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$slaBreached.breachedAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ pendingBreaches, resolvedBreaches, trends });
  } catch (error) {
    console.error("Error in getSlaBreachedRequests:", error); // Log the error
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getSuspiciousRequests = async (req, res) => {
  try {
    if (req.user.role !== "trustee") {
      return res.status(403).json({ message: "Access denied" });
    }

    const suspiciousRequests = await Request.find({
      suspiciousActivity: { $exists: true, $not: { $size: 0 } },
    })
      .populate("approvedBy", "name email")
      .populate("resource", "name organization");

    res.json(suspiciousRequests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getExpiredRequests = async (req, res) => {
  try {
    const logs = await RequestLog.find({
      action: "rejected",
      performedBy: null,
    }) // Filter auto-expired logs
      .populate("request", "eventDetails requestedDate durationDays priority")
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.resolveSLABreach = async (req, res) => {
  try {
    const { requestId } = req.params; // Ensure requestId is extracted correctly
    const resolvedBy = req.user._id; // Assuming the user resolving the breach is authenticated

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (!request.slaBreached.isBreached) {
      return res
        .status(400)
        .json({ message: "This request has no SLA breach to resolve" });
    }

    // Update the SLA breach status
    request.slaBreached.resolved = true;
    request.slaBreached.resolvedAt = new Date();
    request.slaBreached.resolvedBy = resolvedBy;

    await request.save();

    res.json({ message: "SLA breach resolved successfully", request });
  } catch (error) {
    console.error("Error resolving SLA breach:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// metricsController.js

// controllers/metricsController.js
exports.getSLAMetrics = async (req, res) => {
  try {
    const { organization, startDate, endDate } = req.query;

    // Match stage for filtering
    const match = { "slaBreached.isBreached": true };
    if (organization) match.organization = organization;

    // Add date range filter if startDate and endDate are provided
    if (startDate && endDate) {
      match["slaBreached.breachedAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      match["slaBreached.breachedAt"] = { $gte: new Date(startDate) };
    } else if (endDate) {
      match["slaBreached.breachedAt"] = { $lte: new Date(endDate) };
    }

    // Fetch total breaches
    const totalBreaches = await Request.countDocuments(match);

    // Fetch resolved breaches
    const resolvedBreaches = await Request.countDocuments({
      ...match,
      "slaBreached.resolved": true,
    });

    // Fetch pending breaches
    const pendingBreaches = await Request.countDocuments({
      ...match,
      "slaBreached.resolved": false,
    });

    res.json({
      totalBreaches,
      resolvedBreaches,
      pendingBreaches,
    });
  } catch (error) {
    console.error("Error fetching SLA metrics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
