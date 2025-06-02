import connectDB from "./db.js";
import { Message } from "./schema.js";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido, use GET.' });
  }

  await connectDB();

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'session_id obrigatório.' });
  }

  try {
    const messages = await Message.find({ session_id }).sort({ timestamp: 1 });
    return res.status(200).json({ messages });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar mensagens.' });
  }
}
