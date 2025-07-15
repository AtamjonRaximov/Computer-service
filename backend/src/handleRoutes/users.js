import { getCurrentUser } from "../utils/getCurrentUser.js"
import { sendJson } from "../utils/response.js";
import { db } from "../utils/mongodb.js";
import { handleRequest } from "../utils/handleRequest.js";
import { ObjectId } from "mongodb";
import { hashPassword } from "../utils/hash.js";

const usersCollection = db.collection("users");

export async function getAuthUser(req, res) {
        const user = await getCurrentUser(req, res);
        if (!user) {
          sendJson(res, 401, { error: "Unauthorized" });
          return;
        }
        const {password, ...userWithoutPassword} = user;
        return sendJson(res, 200, userWithoutPassword);
}

export async function getAllUsers(req, res) {
    const current = await getCurrentUser(req, res);

    if (current?.role === "manager") {
        const users = await usersCollection.find({}).toArray();
        return sendJson(res, 200, users);
    }
    else {
        return sendJson(res, 403, { error: "Sizda ruxsat yo'q" });
    }

}

export async function partialUpdateUser(req, res) {
    try {
      const current = await getCurrentUser(req, res);
      const { firstName, lastName, password } = await handleRequest(req);
  
      const updateFields = {};
  
      if (firstName && firstName !== current.firstName) {
        updateFields.firstName = firstName;
      }
  
      if (lastName && lastName !== current.lastName) {
        updateFields.lastName = lastName;
      }
  
      if (password) {
          const hashedPassword = await hashPassword(password);
          updateFields.password = hashedPassword;
      }
  
      if (Object.keys(updateFields).length === 0) {
        return sendJson(res, 400, { message: "Hech qanday o‘zgarish topilmadi" });
      }
  
      await usersCollection.updateOne(
        { _id: new ObjectId(current._id) },
        { $set: updateFields }
      );
  
      return sendJson(res, 200, { message: "Foydalanuvchi muvaffaqiyatli yangilandi" });
    } catch (error) {
      console.error(error);
      return sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
    }
  }