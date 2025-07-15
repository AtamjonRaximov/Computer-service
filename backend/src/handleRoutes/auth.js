import { db } from "../utils/mongodb.js";
import { handleRequest } from "../utils/handleRequest.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { createToken } from "../utils/jwt.js";
import { sendJson } from "../utils/response.js";

const users = db.collection("users");

export async function register(req, res) {
  try {
    const { email, password, firstName, lastName, isLegalEntity, companyName } = await handleRequest(req);

    if (!email || !password || !firstName || !lastName)
      return sendJson(res, 400, { error: "Barcha maydonlar to'ldirilishi kerak" });

    if (await users.findOne({ email }))
      return sendJson(res, 409, { error: "Bu email ro'yxatdan o'tgan" });

    if (isLegalEntity)
      if (!companyName)
        return sendJson(res, 400, { error: "Barcha maydonlar to'ldirilishi kerak" });

    const hashedPassword = await hashPassword(password);
    const result = await users.insertOne({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "user",
      isLegalEntity,
      companyName,
      createdAt: new Date(),
    });

    const token = createToken({ id: result.insertedId });

    sendJson(res, 201, {
      message: "Siz muvaffaqiyatli ro'yxatdan o'tdingiz",
      userId: result.insertedId,
    }, token);
  } catch (err) {
    sendJson(res, 500, { error: "Serverda xatolik" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = await handleRequest(req);

    if (!email || !password)
      return sendJson(res, 400, { error: "Email va parol kerak" });

    const user = await users.findOne({ email });
    if (!user)
      return sendJson(res, 400, { error: "Noto‘g‘ri email yoki parol" });

    const match = await comparePassword(password, user.password);
    if (!match)
      return sendJson(res, 400, { error: "Noto‘g‘ri email yoki parol" });

    const token = createToken({ id: user._id });

    sendJson(res, 200, {
      message: "Kirish muvaffaqiyatli",
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role
      },
    }, token);
  } catch (err) {
    sendJson(res, 500, { error: "Serverda xatolik" });
  }
}

export function logout(req, res) {
  res.writeHead(200, {
    'Set-Cookie': `token=; HttpOnly; Path=/; Max-Age=0`, 
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify({ message: "Chiqish muvaffaqiyatli amalga oshirildi" }));
}