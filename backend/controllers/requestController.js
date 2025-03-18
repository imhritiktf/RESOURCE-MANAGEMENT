const Request = require("../models/Request");
const Resource = require("../models/Resource");
const RequestLog = require("../models/RequestLog");

// Create a new resource request
exports.createRequest = async (req, res) => {
  try {
    const { resource, eventDetails, requestedDate, durationDays, priority, organization } = req.body;
    // const org = ["CSC", "GHP"]
    // if(!org.includes(organization)){
    //   return res.status(400).json({ message: "Invalid Organization" });
    // }

    if (!resource || !eventDetails || !requestedDate || !durationDays || !organization) {
      return res.status(400).json({ message: "All fields are required" });
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
      organization:req.user.organization
    });

    await newRequest.save();

    res.status(201).json({ message: "Request submitted successfully", request: newRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    let query = {}; // Default: Trustees see all requests
    const { status, priority, organization, startDate, endDate, lastMonth, sortBy, limit = 10, page = 1, facultyName, resourceName } = req.query;

    // 🟠 **Filter: Supervisors See Only Assigned Resources**
    if (req.user.role === "supervisor") {
      const assignedResourceIds = req.user.assignedResources.map(r => r._id.toString());
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
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      query.createdAt = { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth };
    }

    // 🟠 **Search: Faculty Name & Resource Name**
    let facultyQuery = {};
    let resourceQuery = {};
    if (facultyName) facultyQuery = { name: { $regex: facultyName, $options: "i" } };
    if (resourceName) resourceQuery = { name: { $regex: resourceName, $options: "i" } };

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
      .populate({ path: "resource", match: resourceQuery, select: "name" })
      .populate("approvedBy", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Filter out requests where `populate` didn't match the search criteria
    const filteredRequests = requests.filter(req => req.faculty && req.resource);

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
    const { status, priority, organization, startDate, endDate, lastMonth, sortBy, limit = 10, page = 1 } = req.query;
    let filterOptions = { faculty: req.user._id }; // Default: fetch only faculty's requests

    // 📌 **Filter by Status**
    if (status) {
      filterOptions.status = status;
    }

    // 📌 **Filter by Priority**
    if (priority) {
      filterOptions.priority = priority;
    }

    // 📌 **Filter by Organization**
    if (organization) {
      filterOptions.organization = organization;
    }

    // 📌 **Filter by Start & End Date**
    if (startDate || endDate) {
      filterOptions.createdAt = {};
      if (startDate) {
        filterOptions.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filterOptions.createdAt.$lte = new Date(endDate);
      }
    }

    // 📌 **Filter for Last Month's Requests**
    if (lastMonth) {
      const now = new Date();
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      filterOptions.createdAt = { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth };
    }

    // 📌 **Sorting Logic**
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sortBy === "status") sortOptions = { status: 1 };
    if (sortBy === "priority") sortOptions = { priority: -1 }; // Urgent first

    // 📌 **Pagination**
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // 📌 **Fetch Requests**
    const requests = await Request.find(filterOptions)
      .populate("resource", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // 📌 **Get Total Count for Pagination**
    const totalRequests = await Request.countDocuments(filterOptions);
    const totalPages = Math.ceil(totalRequests / limitNum);

    res.json({
      requests,
      totalRequests,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    console.log("🔹 Request received to update status:", req.params.id);
    console.log("🔹 Request Body:", req.body);
    console.log("🔹 User Role:", req.user.role);

    const { status, rejectionReason } = req.body;
    
    // ✅ Populate faculty to get their organization
    const request = await Request.findById(req.params.id).populate("faculty", "organization");

    if (!request) {
      console.log("❌ Request not found");
      return res.status(404).json({ message: "Request not found" });
    }

    // ✅ Ensure organization is correctly assigned
    if (!request.organization) {
      console.log("⚠️ Organization field is missing! Assigning from faculty.");
      request.organization = request.faculty.organization;  // ✅ Use faculty's organization
    }

    // 🛑 Supervisor Access Control
    if (req.user.role === "supervisor") {
      const assignedResourceIds = (req.user.assignedResources || []).map(r => r.toString());
      if (!assignedResourceIds.includes(request.resource.toString())) {
        console.log("❌ Access Denied! Supervisor not assigned to this resource.");
        return res.status(403).json({ message: "Access denied! You can only approve/reject assigned resources." });
      }
    }

    // ❌ Ensure Rejection Reason is Provided
    if (status === "rejected" && !rejectionReason) {
      console.log("❌ Rejection reason required but missing.");
      return res.status(400).json({ message: "Rejection reason is required." });
    }

    // 🚨 Suspicious Activity Detection
    const now = new Date();
    const timeSinceRequest = (now - request.createdAt) / 1000; // Convert to seconds
    let suspiciousActivity = request.suspiciousActivity || [];

    if (timeSinceRequest < 10) {
      console.log("⚠️ Suspicious Activity: Approval too fast.");
      suspiciousActivity.push({ type: "tooFast", detectedAt: now });
    }

    if (request.requestedDate < now) {
      console.log("⚠️ Suspicious Activity: Approval too late.");
      suspiciousActivity.push({ type: "tooLate", detectedAt: now });
    }

    // ✅ Update Request
    request.status = status;
    request.approvedBy = req.user._id;
    request.approvalTime = now;
    request.suspiciousActivity = suspiciousActivity;
    request.lastUpdatedBy = req.user._id;

    if (status === "rejected") {
      request.rejectionReason = rejectionReason;
    } else {
      request.rejectionReason = undefined;
    }

    console.log("✅ Saving updated request...");
    await request.save();

    // 📜 Log Approval/Rejection
    console.log("📜 Creating approval log entry...");
    const logEntry = new RequestLog({
      request: request._id,
      action: status === "approved" ? "approved" : "rejected",
      performedBy: req.user._id,
      timestamp: now,
      details: status === "rejected" ? `Rejection Reason: ${rejectionReason}` : "Request Approved",
    });

    await logEntry.save();

    console.log("✅ Request updated successfully!");
    res.json({
      message: `Request ${status} successfully`,
      request,
      suspiciousActivity,
    });
  } catch (error) {
    console.error("❌ Server Error:", error.message);
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
      return res.status(400).json({ message: "Approved or rejected requests cannot be deleted" });
    }

    await request.deleteOne();
    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// get request logd
exports.getRequestLog = async (req, res) => {
  try{
    let filter = {};

    if (req.user.role === "faculty") {
      // Faculty can only see logs of their own requests
      filter["request.faculty"] = req.user._id;
    } else if (req.user.role === "supervisor") {
      // Supervisors can only see logs of requests related to their assigned resources
      filter["request.resource"] = { $in: req.user.assignedResources };
    }
    // Trustees can see all logs, so no need to modify filter

    const logs = await RequestLog.find(filter)  
    .populate("request", "eventDetails requestedDate status")
    .populate("performedBy", "name email role")
    .sort({ timestamp: -1 });

    res.json(logs);

  }catch(error){
    res.status(500).json({ message: "Server error", errror:error.message });
  }
}
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
      return res.status(404).json({ message: "No logs found for this request" });
    }

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getExpiredRequests = async (req, res) => {
  try {
    const logs = await RequestLog.find({ action: "rejected", performedBy: null }) // Filter auto-expired logs
      .populate("request", "eventDetails requestedDate durationDays priority")
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getSlaBreachedRequests = async (req, res) => {
  try {
    // Ensure only trustees can access this
    if (req.user.role !== "trustee") {
      return res.status(403).json({ message: "Access denied! Only trustees can view SLA-breached requests." });
    }

    const breachedRequests = await Request.find({ slaBreached: true })
      .populate("faculty", "name email department")
      .populate({
        path: "resource",
        select: "name organization supervisors",
        populate: { path: "supervisors", select: "name email role" } // Get supervisor details
      });

    res.json(breachedRequests);
  } catch (error) {
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
