export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido, use POST.' });
  }

  const { session_id, from, message } = req.body;

  if (!session_id || !from || !message) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  return res.status(200).json({ success: true, received: { session_id, from, message } });
}
