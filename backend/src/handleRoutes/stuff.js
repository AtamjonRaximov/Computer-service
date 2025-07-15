import { db } from "../utils/mongodb.js";
import { sendJson } from "../utils/response.js";
import { hashPassword } from "../utils/hash.js";
import { sendToEmail } from "../utils/sendToEmail.js";

const users = db.collection("users");

const rolesData = [
  { role: "manager", email: "manager@gmail.com", password: "manager", firstname: "Auto", lastname: "Manager" },
  { role: "master", email: "master@gmail.com", password: "master", firstname: "Auto", lastname: "Master" },
  { role: "user", email: "user@gmail.com", password: "user", firstname: "Auto", lastname: "User" },
];

export async function createRoles(req, res) {
  try {
    const createdUsers = [];

    for (const { role, email, password, firstname, lastname } of rolesData) {
      let user = await users.findOne({ email });

      if (!user) {
        const hashedPassword = await hashPassword(password);

        const newUser = {
          email,
          password: hashedPassword,
          firstname,
          lastname,
          role,
          createdAt: new Date(),
        };

        await users.insertOne(newUser);

        const subject = `${role.charAt(0).toUpperCase() + role.slice(1)} akkaunti yaratildi`;
        const text = `Hurmatli ${firstname}, siz uchun ${role} akkaunti yaratildi.\n\nLogin: ${email}\nParol: ${password}`;

        await sendToEmail(email, subject, text);

        createdUsers.push(role);
      }
    }

    if (createdUsers.length === 0) {
      return sendJson(res, 200, { message: "Barcha role'lar allaqachon mavjud" });
    }

    return sendJson(res, 201, { message: `Quyidagi role'lar yaratildi: ${createdUsers.join(", ")}` });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
  }
}
