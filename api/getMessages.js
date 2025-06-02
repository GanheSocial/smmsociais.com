// /api/sendMessage.js

import connectDB from './db.js';
import { User, Message } from './schema.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { session_id, message, from } = req.body;

  if (!session_id || !message || !from) {
    return res.status(400).json({ error: 'Campos obrigatórios: session_id, message, from' });
  }

  await connectDB();

  const authHeader = req.headers.authorization;
  let isAttendant = false;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    isAttendant = true;
  }

  try {
    const newMessage = new Message({
      session_id,
      message,
      from,
      timestamp: new Date()
    });

    await newMessage.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro em /api/sendMessage:', error);
    return res.status(500).json({ error: 'Erro ao salvar mensagem' });
  }
}
