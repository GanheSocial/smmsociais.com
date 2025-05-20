import connectDB from "./db.js";
import { Servico } from "./Servico.js";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    await connectDB();

    const { id } = req.query; // ou req.params se estiver usando Express

    if (!id) {
      return res.status(400).json({ erro: 'ID do serviço é obrigatório' });
    }

    const servico = await Servico.findById(id);

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    return res.status(200).json(servico);
  } catch (erro) {
    console.error('Erro ao buscar serviço:', erro);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}
