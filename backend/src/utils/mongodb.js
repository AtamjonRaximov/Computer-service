import { MongoClient } from "mongodb"

const uri = "mongodb+srv://asultonkabirov:1sckcPUDiPp9Yya2@cluster0.xvd5tvi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri)

const db = client.db("service")

async function connect(){
    await client.connect()
    console.log("Mongo db ga ulandi")
}

export {db, connect}