import { db } from "../utils/mongodb.js";
import { handleRequest } from "../utils/handleRequest.js";
import { sendJson } from "../utils/response.js";

const components = db.collection("components");

export async function createComponent(req, res) {
  try {
    const body = await handleRequest(req);
    const { name, description, price, quantity } = body;

    if (!name || !description || price === undefined || quantity === undefined) {
      return sendJson(res, 400, { error: "Barcha maydonlar to‘ldirilishi shart" });
    }

    const newComponent = {
      name,
      description,
      price: Number(price),
      quantity: Number(quantity),
      createdAt: new Date(),
    };

    const result = await components.insertOne(newComponent);

    return sendJson(res, 201, {
      message: "Component yaratildi",
      componentId: result.insertedId,
    });

  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
  }
}

export async function getAllComponents(req, res) {
  try {
    const allComponents = await components.find({}).toArray();
    return sendJson(res, 200, allComponents);
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
  }
}
