import connectDB from "./db.js";
import { User } from "./User.js";
import { Action } from "./Action.js";
import Servico from "./Servico.js";

const handler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    await connectDB();

    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authorization.split(" ")[1];
    const usuario = await User.findOne({ token });

    if (!usuario) {
      return res.status(401).json({ error: "Token inválido ou usuário não encontrado!" });
    }

    const status = req.query.status;
    const match = { userId: usuario._id };

    if (status && status !== "todos") {
      if (status === "pending") {
        match.validadas = 0;
      } else if (status === "progress") {
        match.$expr = { $and: [ { $gt: ["$validadas", 0] }, { $lt: ["$validadas", "$quantidade"] } ] };
      } else if (status === "completed") {
        match.$expr = { $eq: ["$validadas", "$quantidade"] };
      } else {
        match.status = status;
      }
    }

    const acoes = await Action.aggregate([
      { $match: match },
      { $sort: { dataCriacao: -1 } }
    ]);

    // Busca serviços relacionados
    const idsServico = [...new Set(acoes.map(a => a.id_servico))];
    const servicos = await Servico.find({ id_servico: { $in: idsServico } });

    const acoesComDetalhes = acoes.map(acao => {
      const obj = acao;
      obj.servicoDetalhes = servicos.find(s => s.id_servico === obj.id_servico) || null;
      return obj;
    });

    return res.json({ acoes: acoesComDetalhes });

  } catch (error) {
    console.error("Erro ao buscar histórico de ações:", error);
    return res.status(500).json({ error: "Erro ao buscar histórico de ações" });
  }
};

export default handler;
