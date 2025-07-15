import { db } from "../utils/mongodb.js";
import { ObjectId } from 'mongodb';
import { hashPassword } from "../utils/hash.js";
import { sendJson } from "../utils/response.js";
import { sendToEmail } from "../utils/sendToEmail.js";
import { handleRequest } from "../utils/handleRequest.js";
import { getCurrentUser } from "../utils/getCurrentUser.js";

const users = db.collection("users");
const services = db.collection("services");
const componentsCollection = db.collection("components");

export async function createServiceRequest(req, res) {
  try {
    const body = await handleRequest(req);
    const { device_model, issue_type, problem_area, description, location, email, fullName } = body;

    if (!device_model || !issue_type || !problem_area || !description || !location) {
      return sendJson(res, 400, { error: "Barcha majburiy maydonlar to‘ldirilishi kerak" });
    }

    let owner = null;

    if (email && fullName) {
      owner = await users.findOne({ email });

      if (!owner) {
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(randomPassword);

        const firstname = fullName.split(" ")[0] || fullName;
        const lastname = fullName.split(" ")[1] || "";

        const newUser = {
          email,
          password: hashedPassword,
          firstname,
          lastname,
          role: "user",
          createdAt: new Date(),
        };

        const result = await users.insertOne(newUser);
        owner = { _id: result.insertedId, ...newUser };

        const subject = "Hisobingiz yaratildi";
        const text = `Hurmatli ${firstname}, siz uchun hisob yaratildi.\n\nLogin: ${email}\nParol: ${randomPassword}`;
        await sendToEmail(email, subject, text);
      }
    } else {
      owner = await getCurrentUser(req);
    }

    if (!owner) {
      return sendJson(res, 401, { error: "Foydalanuvchi topilmadi" });
    }

    const { password, ...ownerData } = owner;

    const newServiceRequest = {
      device_model,
      issue_type,
      problem_area,
      description,
      location,
      owner: ownerData,
      createdAt: new Date(),
      status: "pending"
    };

    const result = await services.insertOne(newServiceRequest);

    return sendJson(res, 201, {
      message: "So‘rov muvaffaqiyatli yaratildi",
      serviceId: result.insertedId
    });

  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
  }
}

export async function sendToMaster(req, res, url) {
  const parts = url.split('/'); 
  const serviceId = parts[4]; 

  if (!serviceId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'ID topilmadi' }));
  }

  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "manager") {
      return sendJson(res, 403, { error: "Faqat manager bu amalni bajarishi mumkin" });
    }

    if (!ObjectId.isValid(serviceId)) {
      return sendJson(res, 400, { error: "Noto‘g‘ri serviceId formati" });
    }

    const serviceRequest = await services.findOne({ _id: new ObjectId(serviceId) });
    if (!serviceRequest) {
      return sendJson(res, 404, { error: "So‘rov topilmadi" });
    }

    const master = await users.findOne({ role: "master" });
    if (!master) {
      return sendJson(res, 404, { error: "Master topilmadi" });
    }

    const { password, ...masterData } = master;

    const updateResult = await services.updateOne(
      { _id: new ObjectId(serviceId) },
      {
        $set: {
          master: masterData,
          status: "in_review",
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return sendJson(res, 500, { error: "So‘rovni yangilab bo‘lmadi" });
    }

    return sendJson(res, 200, { message: "So‘rov masterga yuborildi" });

  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
  }
}

export async function updateService(req, res) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "master") {
      return sendJson(res, 403, { error: "Faqat master bu amalni bajarishi mumkin" });
    }

    const body = await handleRequest(req);
    const { price, finishedAt, components, requestId } = body;

    if (price === undefined || !finishedAt || !components || !Array.isArray(components) || components.length === 0) {
      return sendJson(res, 400, { error: "Narx, tugash sanasi va componentlar kiritilishi shart" });
    }

    if (!ObjectId.isValid(requestId)) {
      return sendJson(res, 400, { error: "Noto‘g‘ri requestId formati" });
    }

    const serviceRequest = await services.findOne({ _id: new ObjectId(requestId) });
    if (!serviceRequest) {
      return sendJson(res, 404, { error: "Xizmat so‘rovi topilmadi" });
    }

    const usedProducts = [];
    const updatedProducts = [];

    for (const comp of components) {
      const { componentId, quantity } = comp;

      if (!componentId || !ObjectId.isValid(componentId)) {
        return sendJson(res, 400, { error: `Noto‘g‘ri componentId: ${componentId}` });
      }

      const component = await componentsCollection.findOne({ _id: new ObjectId(componentId) });
      if (!component) {
        return sendJson(res, 404, { error: `Component topilmadi: ${componentId}` });
      }

      const usedQty = quantity && quantity > 0 ? quantity : 1;

      if (component.quantity < usedQty) {
        return sendJson(res, 400, {
          error: `Component "${component.name}" uchun yetarli miqdor yo‘q. Mavjud: ${component.quantity}, So‘ralgan: ${usedQty}`
        });
      }

      await componentsCollection.updateOne(
        { _id: new ObjectId(componentId) },
        { $inc: { quantity: -usedQty } }
      );

      usedProducts.push({
        _id: new ObjectId(componentId),
        quantity: usedQty,
      });

      updatedProducts.push({
        componentId: component._id,
        name: component.name,
        price: component.price,
        usedQuantity: usedQty,
      });
    }

    const updateData = {
      price,
      finishedAt: new Date(finishedAt),
      usedProducts,
      updatedProducts,
      status: "approved",
      updatedAt: new Date(),
    };

    const result = await services.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return sendJson(res, 500, { error: "Xizmat so‘rovini yangilashda xatolik yuz berdi" });
    }

    return sendJson(res, 200, { message: "Xizmat so‘rovi muvaffaqiyatli yangilandi" });

  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
  }
}

export async function getAllServices(req, res) {
  try {
    const user = await getCurrentUser(req);
    let db_requests = [];
    if (user && user.role === "master") {
      db_requests = await services.find({  "master._id": user._id }).toArray();
    }
    else if (user.role === "user") {
      db_requests = await services.find({  "owner._id": user._id }).toArray();
    }
    else if (user.role === "manager") {
      db_requests = await services.find({}).toArray();
    }
    return sendJson(res, 200, db_requests);
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
  }
}

export async function updateServiceStatus(req, res) {

  try {
    const currentUser = await getCurrentUser(req);
    const { requestId } = await handleRequest(req);

    let updated;

    if (currentUser.role==="user"){
      updated = {$set: { status: "in_progress", updatedAt: new Date() }}
    }
    else if (currentUser.role==="master"){
      updated = {$set: { status: "approved", updatedAt: new Date() }}
    }
    else{
      return sendJson(res, 403, { error: "Faqat user va master bu amalni bajarishi mumkin" });
    }

    if (!ObjectId.isValid(requestId)) {
      return sendJson(res, 400, { error: "Noto‘g‘ri serviceId formati" });
    }
    const serviceRequest = await services.findOne({ _id: new ObjectId(requestId) });

    if (!serviceRequest) {
      return sendJson(res, 404, { error: "So‘rov topilmadi" });
    }
    await services.updateOne({ _id: new ObjectId(requestId) },updated);
    return sendJson(res, 200, { message: "yangilandi" });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
  }
}

export async function completeService(req, res) {
  try {
    const { requestId } = await handleRequest(req);
    if (!ObjectId.isValid(requestId)) {
      return sendJson(res, 400, { error: "Noto‘g‘ri serviceId formati" });
    }
    const serviceRequest = await services.findOne({ _id: new ObjectId(requestId) });
    if (!serviceRequest) {
      return sendJson(res, 404, { error: "So‘rov topilmadi" });
    }
    await services.updateOne({ _id: new ObjectId(requestId) }, { $set: { status: "completed", updatedAt: new Date() } });
    return sendJson(res, 200, { message: "yangilandi" });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Serverda xatolik yuz berdi" });
  }
}