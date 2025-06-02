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

    if (req.method === 'GET') {
      // Retornar lista de sessões (última mensagem de cada uma)
      const sessions = await Message.aggregate([
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: '$session_id',
            lastMessage: { $first: '$message' },
            lastFrom: { $first: '$from' },
            lastTime: { $first: '$timestamp' },
          }
        },
        { $sort: { lastTime: -1 } }
      ]);

      return res.status(200).json({ sessions });
    }

    if (req.method === 'POST') {
      const { session_id, message } = req.body;

      if (!session_id || !message) {
        return res.status(400).json({ error: 'session_id e message são obrigatórios' });
      }

      await Message.create({
        session_id,
        from: 'support',
        message,
        timestamp: new Date()
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro em /api/supportMessages:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
