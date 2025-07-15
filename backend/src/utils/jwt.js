import jwt from "jsonwebtoken";

const SECRET_KEY = "your_secret_key"; 

export function createToken(payload, expiresIn = "30d") {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    return null;
  }
}
