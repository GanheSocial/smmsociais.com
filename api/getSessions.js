// /api/getSessions.js
import connectDB from './db.js';
import { Message } from './schema.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  await connectDB();

  try {
    const sessions = await Message.distinct('session_id');
    res.status(200).json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar sessões' });
  }
}
