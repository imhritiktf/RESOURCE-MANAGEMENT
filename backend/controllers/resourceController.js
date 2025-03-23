const Resource = require("../models/Resource");
const User = require("../models/User");
const csvParser = require("csv-parser");
const { isValidObjectId } = require("mongoose"); 
const Request = require("../models/Request");
const ResourceUsageLog = require("../models/ResourceUsageLog");



// Create a new resource (Only trustees can add resources)
exports.createResource = async (req, res) => {
  try {
    const { name, description, organization, supervisors, section,slaTime } = req.body;

    console.log(name, description, organization, supervisors, section)
    // Ensure only trustees can create resources
    if (req.user.role !== "trustee") {
      return res
        .status(403)
        .json({ message: "Access denied! Only trustees can add resources." });
    }

    // Validate required fields
    if (!name || !organization || !supervisors || supervisors.length !== 2 || !section) {
      return res.status(400).json({
        message:
          "All fields are required, and exactly two supervisors must be assigned.",
      });
    }

    // Ensure the organization is valid
    if (!["CSC", "GHP"].includes(organization)) {
      return res.status(400).json({ message: "Invalid organization name" });
    }

    // Prevent duplicate supervisor IDs
    if (new Set(supervisors).size !== supervisors.length) {
      return res.status(400).json({ message: "Supervisors must be unique." });
    }

    // Validate that the assigned supervisors exist and belong to the same organization
    const supervisorUsers = await User.find({
      _id: { $in: supervisors },
      role: "supervisor",
      organization,
    });
    if (supervisorUsers.length !== 2) {
      return res.status(400).json({
        message: "Supervisors must exist and belong to the specified organization.",
      });
    }

    // Check if the resource already exists in the same organization and section
    const existingResource = await Resource.findOne({ name, organization, section });
    if (existingResource) {
      return res.status(400).json({
        message: "Resource with this name already exists in the organization and section.",
      });
    }

    // Validate SLA time (must be a positive number and <= 10080 minutes (7 days))
    if (slaTime && (typeof slaTime !== "number" || slaTime <= 0 || slaTime > 10080)) {
      return res.status(400).json({ message: "SLA time must be a positive number and <= 10080 minutes (7 days)" });
    }

    // Create the new resource
    const newResource = new Resource({
      name,
      description,
      organization,
      supervisors,
      section,
      availability: true,
      slaTime: slaTime || 2880, // Default to 48 hours if not provided
    });

    await newResource.save();
    res.status(201).json({ message: "Resource added successfully", resource: newResource });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Update Resource Controller
exports.updateResource = async (req, res) => {
  const { id } = req.params; // Resource ID to update
  const { name, organization, supervisors, description, availability, section, slaTime } = req.body; // Updated data

  try {
    // Validate the resource ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid resource ID" });
    }

    // Validate the organization (must be either "CSC" or "GHP")
    if (organization && !["CSC", "GHP"].includes(organization)) {
      return res.status(400).json({ message: "Organization must be either 'CSC' or 'GHP'" });
    }

    // Validate the supervisors (must be exactly 2 supervisors)
    if (supervisors && supervisors.length !== 2) {
      return res.status(400).json({ message: "Exactly 2 supervisors are required" });
    }

    // Validate supervisor IDs (must be valid ObjectId)
    if (supervisors && supervisors.some((supervisor) => !isValidObjectId(supervisor))) {
      return res.status(400).json({ message: "Invalid supervisor ID(s)" });
    }

    // Validate SLA time (must be a positive number and <= 10080 minutes (7 days))
    // if (slaTime && (typeof slaTime !== "number" || slaTime <= 0 || slaTime > 10080)) {
    //   return res.status(400).json({ message: "SLA time must be a positive number and <= 10080 minutes (7 days)" });
    // }

    // Find the resource by ID
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Update the resource fields
    if (name) resource.name = name;
    if (organization) resource.organization = organization;
    if (supervisors) resource.supervisors = supervisors;
    if (description) resource.description = description;
    if (availability !== undefined) resource.availability = availability;
    if (section) resource.section = section; // Update the section field
    if (slaTime !== undefined) resource.slaTime = slaTime; // Update the SLA time field

    // Save the updated resource
    await resource.save();

    // Return the updated resource
    res.status(200).json({ message: "Resource updated successfully", resource });
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all resources
exports.getResources = async (req, res) => {
  try {
    const resources = await Resource.find().populate("supervisors","name").sort({ createdAt: -1 })
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a resource
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    await resource.deleteOne();
    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// upkoadind resource in bulk through csv file
exports.uploadResourcesCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    const resources = [];
    const errors = [];
    const processingRows = []; // Store promises for async operations

    require("stream").Readable.from(req.file.buffer.toString())
      .pipe(csvParser())
      .on("data", (row) => {
        processingRows.push(
          (async () => {
            try {
              console.log("Processing row:", row);
              const { name, description, organization, supervisorEmails } = row;

              if (!name || !organization || !supervisorEmails) {
                console.log("Missing fields:", row);
                errors.push({ row, error: "Missing required fields" });
                return;
              }

              if (!["CSC", "GHP"].includes(organization)) {
                console.log("Invalid organization:", row);
                errors.push({ row, error: "Invalid organization" });
                return;
              }

              const supervisorEmailsArray = supervisorEmails.split(",");
              console.log("Supervisor Emails:", supervisorEmailsArray);

              const supervisors = await User.find({ email: { $in: supervisorEmailsArray } }).select("_id");
              console.log("Found supervisors:", supervisors);

              if (supervisors.length !== 2) {
                console.log("Invalid supervisor count:", row);
                errors.push({ row, error: "Exactly 2 valid supervisors required" });
                return;
              }

              const existingResource = await Resource.findOne({ name, organization });
              console.log("Existing Resource:", existingResource);

              if (existingResource) {
                console.log("Duplicate resource:", row);
                errors.push({ row, error: "Resource already exists" });
                return;
              }

              //  FIX: Store only supervisor ObjectIds
              resources.push({
                name,
                description,
                organization,
                supervisors: supervisors.map(s => s._id)
              });

            } catch (error) {
              console.log("Error processing row:", error);
              errors.push({ row, error: "Error processing row" });
            }
          })()
        );
      })
      .on("end", async () => {
        await Promise.all(processingRows); // Wait for all async tasks to complete
        console.log("Final Resources to insert:", resources);

        if (resources.length > 0) {
          await Resource.insertMany(resources);
          console.log(`${resources.length} resources added successfully.`);
        }

        res.json({
          message: `${resources.length} resources added successfully.`,
          errors,
        });
      });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Controller to fetch all unique sections
exports.getSections = async (req, res) => {
  try {
    const sections = await Resource.distinct("section");
    res.status(200).json({ sections });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Resource Usage Analytics
exports.getResourceUsage = async (req, res) => {
  try {
    const { organization, startDate, endDate } = req.query;

    // Match stage for filtering
    const match = {}; // Start with an empty match object
    if (organization) match.organization = organization;
    if (startDate && endDate) {
      match.bookingStart = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Aggregation pipeline
    const analytics = await ResourceUsageLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$resource",
          totalBookings: { $sum: 1 },
          totalDuration: { $sum: "$durationDays" },
        },
      },
      {
        $lookup: {
          from: "resources",
          localField: "_id",
          foreignField: "_id",
          as: "resourceDetails",
        },
      },
      { $unwind: "$resourceDetails" },
      {
        $project: {
          resourceName: "$resourceDetails.name",
          totalBookings: 1,
          totalDuration: 1,
        },
      },
      { $sort: { totalBookings: -1 } },
      { $limit: 5 },
    ]);
    
    console.log("Aggregation Result:", analytics);

    console.log("Aggregation Result:", analytics);

    // Calculate key metrics
    const totalBookings = analytics.reduce((sum, item) => sum + item.totalBookings, 0);
    const averageDuration = analytics.reduce((sum, item) => sum + item.totalDuration, 0) / totalBookings || 0;
    res.json({
      mostUsedResources: analytics,
      totalBookings,
      averageDuration,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Fetch booking trends (daily, weekly, monthly) 
exports.getbookingUsage =  async (req, res) => {
  try {
    const { organization, startDate, endDate, interval } = req.query; // interval: daily, weekly, monthly
    const match = { organization };
    if (startDate && endDate) {
      match.bookingStart = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const groupBy = {
      daily: { $dateToString: { format: "%Y-%m-%d", date: "$bookingStart" } },
      weekly: { $dateToString: { format: "%Y-%U", date: "$bookingStart" } },
      monthly: { $dateToString: { format: "%Y-%m", date: "$bookingStart" } },
    };

    const trends = await ResourceUsageLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupBy[interval],
          totalBookings: { $sum: 1 },
          totalDuration: { $sum: "$durationDays" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Fetch resource utilization
exports.getResourceUtlization = async (req, res) => {
  try {
    const { organization, startDate, endDate } = req.query;
    const match = { organization };
    if (startDate && endDate) {
      match.bookingStart = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const utilization = await ResourceUsageLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$resource",
          totalDuration: { $sum: "$durationDays" },
        },
      },
      {
        $lookup: {
          from: "resources",
          localField: "_id",
          foreignField: "_id",
          as: "resourceDetails",
        },
      },
      { $unwind: "$resourceDetails" },
      {
        $project: {
          resourceName: "$resourceDetails.name",
          utilizationRate: { $multiply: [{ $divide: ["$totalDuration", 30] }, 100] }, // Assuming 30 days in a month
        },
      },
    ]);

    res.json(utilization);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Fetch faculty usage
exports.getFacultyUsage = async (req, res) => {
  try {
    const { organization, startDate, endDate } = req.query;
    const match = { organization };
    if (startDate && endDate) {
      match.bookingStart = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const facultyUsage = await ResourceUsageLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$faculty",
          totalBookings: { $sum: 1 },
          totalDuration: { $sum: "$durationDays" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "facultyDetails",
        },
      },
      { $unwind: "$facultyDetails" },
      {
        $project: {
          facultyName: "$facultyDetails.name",
          totalBookings: 1,
          totalDuration: 1,
        },
      },
      { $sort: { totalBookings: -1 } },
    ]);

    res.json(facultyUsage);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}