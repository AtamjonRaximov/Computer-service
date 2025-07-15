import { db } from "../utils/mongodb.js";
import { getCurrentUser } from "../utils/getCurrentUser.js";
import { sendJson } from "../utils/response.js";

const users = db.collection("users");
const service_requests = db.collection("services");

export async function getVisitorStats(req, res) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "manager") {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Ruxsat yo‘q" }));
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const visitorData = await users.aggregate([
        {
          $match: {
            createdAt: {
              $gte: thirtyDaysAgo,
              $lte: new Date()
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            count: 1
          }
        },
        {
          $sort: { date: 1 }
        }
      ]).toArray();
      
      

      console.log(visitorData)

    sendJson(res, 200, visitorData);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
  }
}

export async function getLocationStats(req, res) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "manager") {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Ruxsat yo‘q" }));
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const locationData = await service_requests.aggregate([
        {
          $group: {
            _id: "$location", // Har bir location bo‘yicha guruhlash
            count: { $sum: 1 } // Nechta so‘rov borligini sanash
          }
        },
        {
          $project: {
            _id: 0,
            source: { $ifNull: ["$_id", "Unknown"] }, // Agar location bo‘lmasa, "Unknown"
            count: 1
          }
        },

      ]).toArray();
      
      
      console.log(locationData);
      
      
    sendJson(res, 200, locationData);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
  }
}

export async function getRequestStats(req, res) {
    try {
      const user = await getCurrentUser(req);
      let filter = {};
  
      if (user.role === "master") {
        filter["master._id"] = user._id;
      } else if (user.role === "user") {
        filter["owner._id"] = user._id;
      } else if (user.role === "manager") {
      } else {
        return sendJson(res, 403, { error: "Ruxsat berilmagan" });
      }
  
      const total = await service_requests.countDocuments(filter);
      const pending = await service_requests.countDocuments({ ...filter, status: "pending" });
      const in_progress = await service_requests.countDocuments({ ...filter, status: "in_progress" });
      const completed = await service_requests.countDocuments({ ...filter, status: "completed" });
  
      const result = {
        total_requests: total,
        pending_requests: pending,
        in_progress_requests: in_progress,
        completed_requests: completed,
      };
  
      return sendJson(res, 200, result);
    } catch (error) {
      console.error(error);
      return sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
    }
  }
  