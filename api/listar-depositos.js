import connectDB from "./db.js";
import { Deposito, Usuario } from "./schema.js";

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

    // Filtra os depósitos pelo ID do usuário
    const depositos = await Deposito.find({ userId }).sort({ createdAt: -1 }).limit(10);

    return res.status(200).json({ depositos });
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
