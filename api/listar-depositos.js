import connectDB from "./db.js";
import { Deposito, User } from "./schema.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    await connectDB();

    // Busca o usuário pelo token
    const usuario = await Usuario.findOne({ token });
    if (!usuario) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    // Busca os depósitos do usuário
    const depositos = await Deposito.find({ userId: usuario._id })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({ depositos });
  } catch (error) {
    console.error("Erro ao listar depósitos:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
