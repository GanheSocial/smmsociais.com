import connectDB from '../db.js';
import Servico from '../Servico.js';

export default async function handler(req, res) {
  await connectDB();

  if (req.method !== 'GET') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const servicos = await Servico.find(); // Busca todos os serviços
    res.status(200).json(servicos);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar serviços' });
  }
}
