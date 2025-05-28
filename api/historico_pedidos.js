import connectDB from "./db.js";
import { User } from "./User.js";
import { Action } from "./Action.js";
import mongoose from "mongoose";

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

    const status = req.query.status; // filtro opcional

    const filtro = { userId: usuario._id };
    if (status && status !== "todos") {
      filtro.status = status;
    }

    // Converter id_servico para ObjectId para fazer lookup corretamente
    const acoes = await Action.aggregate([
      { $match: filtro },
      {
        $addFields: {
          id_servico_obj: {
            $cond: [
              { $and: [ { $ne: ["$id_servico", null] }, { $ne: ["$id_servico", ""] } ] },
              { $toObjectId: "$id_servico" },
              null
            ]
          }
        }
      },
      {
        $lookup: {
          from: "servicos",             // ajuste se seu nome da coleção for diferente
          localField: "id_servico_obj",
          foreignField: "_id",
          as: "servicoDetalhes"
        }
      },
      { $unwind: { path: "$servicoDetalhes", preserveNullAndEmptyArrays: true } },
      { $sort: { dataCriacao: -1 } }
    ]);

    return res.json({ acoes });

  } catch (error) {
    console.error("Erro ao buscar histórico de ações:", error);
    return res.status(500).json({ error: "Erro ao buscar histórico de ações" });
  }
};

export default handler;
