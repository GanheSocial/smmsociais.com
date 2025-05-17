import connectDB from "./db.js";
import { Action } from "./Action.js";
import { ActionHistory } from "./ActionHistory.js"; // Certifique-se de ter esse modelo exportado corretamente

const API_KEY = process.env.SMM_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    await connectDB();
    const { id } = req.query;

    // 🔍 Se foi passado um ID específico, busca e valida o limite
    if (id) {
      const acao = await Action.findById(id);
      if (!acao) {
        return res.status(404).json({ status: 'NAO_ENCONTRADA', message: 'Ação com esse ID não foi encontrada.' });
      }

      const execucoes = await ActionHistory.countDocuments({
        id_pedido: acao._id,
        acao_validada: { $in: [null, true, "true"] }
      });

      if (execucoes >= acao.quantidade) {
        return res.status(403).json({ status: 'LIMITE_ATINGIDO', message: 'Limite de execuções já atingido para esta ação.' });
      }

      return res.json({
        status: 'ENCONTRADA',
        _id: acao._id,
        userId: acao.userId,
        rede: acao.rede,
        tipo: acao.tipo,
        nome: acao.nome,
        valor: acao.valor,
        quantidade: acao.quantidade,
        quantidadeExecutada: execucoes,
        link: acao.link,
        dataCriacao: acao.dataCriacao
      });
    }

    // 🔁 Caso não tenha sido passado um ID, retorna a primeira ação pendente ainda válida
    const acoesPendentes = await Action.find({ status: 'pendente' }).sort({ dataCriacao: 1 });

    for (const acao of acoesPendentes) {
      const execucoes = await ActionHistory.countDocuments({
        id_pedido: acao._id,
        acao_validada: { $in: [null, true, "true"] }
      });

      if (execucoes < acao.quantidade) {
        return res.json({
          status: 'ENCONTRADA',
          _id: acao._id,
          userId: acao.userId,
          rede: acao.rede,
          tipo: acao.tipo,
          nome: acao.nome,
          valor: acao.valor,
          quantidade: acao.quantidade,
          quantidadeExecutada: execucoes,
          link: acao.link,
          dataCriacao: acao.dataCriacao
        });
      }
    }

    // Se nenhuma ação válida foi encontrada
    return res.json({ status: 'NAO_ENCONTRADA' });

  } catch (error) {
    console.error('Erro ao buscar ação disponível:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
