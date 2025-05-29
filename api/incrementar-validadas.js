import { Action } from "./Action.js";
import connectDB from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { id_acao_smm } = req.body;
  if (!id_acao_smm || typeof id_acao_smm !== "number") {
    return res.status(400).json({ error: "ID inválido" });
  }

  await connectDB();

  const result = await Action.updateOne(
    { id_acao_smm: id_acao_smm },
    { $inc: { validadas: 1 } }
  );

  if (result.modifiedCount === 0) {
    return res.status(404).json({ error: "Ação não encontrada" });
  }

  return res.status(200).json({ status: "ok", updated: result.modifiedCount });
}
