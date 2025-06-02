import connectDB from './db.js';
import { Message } from './schema.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { session_id, from, message } = req.body;

  if (!session_id || !from || !message) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  try {
    await connectDB();

    const newMessage = new Message({
      session_id,
      from,
      message,
      timestamp: new Date()
    });

    await newMessage.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro em /api/sendMessage:', error);
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
}
