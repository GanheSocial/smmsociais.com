import connectDB from "./db.js";
import { Deposito } from "./schema.js";

export default async function handler(req, res) {
  const { admin_token } = req.query;

  if (admin_token !== "APP_USR-4392638487978504-053020-58385d412bdf3a5b9de74579fd791060-650613572") {
    return res.status(401).json({ error: "Não autorizado" });
  }

  await connectDB();

  const depositos = await Deposito.find({})
    .sort({ createdAt: -1 })
    .limit(10);

  return res.status(200).json({ depositos });
}
