import { Action } from "./Action.js";
import connectDB from "./db.js";

export default async function handler(req, res) {
  console.log("[incrementar-validadas] chamada recebida");
  console.log("Método:", req.method);
  console.log("Corpo recebido:", req.body);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  let { id_acao_smm } = req.body;

  if (!id_acao_smm) {
    console.log("[incrementar-validadas] id_acao_smm ausente ou inválido:", id_acao_smm);
    return res.status(400).json({ error: "ID inválido" });
  }

  // converter para número se for string numérica
  if (typeof id_acao_smm === "string") {
    id_acao_smm = Number(id_acao_smm);
  }

  if (typeof id_acao_smm !== "number" || isNaN(id_acao_smm)) {
    console.log("[incrementar-validadas] id_acao_smm não é número válido:", id_acao_smm);
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    await connectDB();

    const result = await Action.updateOne(
      { id_acao_smm: id_acao_smm },
      { $inc: { validadas: 1 } }
    );

    console.log("[incrementar-validadas] resultado do update:", result);

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Ação não encontrada" });
    }

    return res.status(200).json({ status: "ok", updated: result.modifiedCount });

  } catch (error) {
    console.error("[incrementar-validadas] erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
