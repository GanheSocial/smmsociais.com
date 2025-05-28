import connectDB from "./db.js";
import { User } from "./User.js";

const handler = async (req, res) => {
  try {
    await connectDB();

    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authorization.split(" ")[1];
    const usuario = await User.findOne({ token });

    if (!usuario) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    return res.status(200).json({ userId: usuario._id });
  } catch (error) {
    console.error("Erro ao buscar userId:", error);
    return res.status(500).json({ error: "Erro ao buscar userId" });
  }
};

export default handler;
