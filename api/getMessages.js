import connectDB from './db.js';
import { User, Message } from './schema.js';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  const token = authHeader.split(' ')[1];

  try {
    await connectDB();

    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id é obrigatório' });
    }

    const messages = await Message
      .find({ session_id })
      .sort({ timestamp: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('Erro em /api/getMessages:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
