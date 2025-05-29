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

    // 🔄 Atualizar status automaticamente:
    // De "pendente" para "progress" se validadas > 0
    await Action.updateMany(
      { status: "pendente", validadas: { $gt: 0 } },
      { $set: { status: "progress" } }
    );

    // De "pendente" ou "progress" para "completed" se validadas === quantidade
    await Action.updateMany(
      { status: { $in: ["pendente", "progress"] }, $expr: { $eq: ["$validadas", "$quantidade"] } },
      { $set: { status: "completed" } }
    );

    // 🔎 Filtro dinâmico conforme status da query
    const status = req.query.status;
    const filtro = { userId: usuario._id };

    if (status && status !== "todos") {
      if (status === "pending") {
        filtro.validadas = 0;
      } else if (status === "progress") {
        filtro.validadas = { $gt: 0 };
        filtro.status = "progress";
      } else {
        filtro.status = status;
      }
    }

    // 🔍 Buscar ações do usuário
    const acoes = await Action.find(filtro).sort({ dataCriacao: -1 });

    // 🔗 Buscar os serviços relacionados
    const idsServico = [...new Set(acoes.map(a => a.id_servico))];
    const servicos = await Servico.find({ id_servico: { $in: idsServico } });

    // 🧩 Anexar detalhes dos serviços a cada ação
    const acoesComDetalhes = acoes.map(acao => {
      const obj = acao.toObject();
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
