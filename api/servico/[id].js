import connectDB from "./db.js";
import { Servico } from "./Servico.js";

export default async function handler(req, res) {
  await connectDB();

  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const servico = await Servico.findById(id);

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    res.status(200).json(servico);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro no servidor' });
  }
}
