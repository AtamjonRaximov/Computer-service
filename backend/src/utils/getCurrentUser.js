import jwt from "jsonwebtoken";
import { db } from "./mongodb.js";
import { ObjectId } from "mongodb";
import {verifyToken} from './jwt.js'

const users = db.collection("users");

export async function getCurrentUser(req) {
  try {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(cookie => cookie.trim().split("="))
    );

    const token = cookies.token;
    if (!token) return null;

    const userId = verifyToken(token);
    if (!userId) return null;

    const user = await users.findOne({ _id: new ObjectId(userId) });
    return user || null;
  } catch (error) {
    return null;
  }
}
