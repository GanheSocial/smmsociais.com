import connectDB from "./db.js";
import { Action } from "./Action.js";
import { User } from "./User.js";
import mongoose from "mongoose";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    await connectDB();

    const { authorization } = req.headers;
    const chaveEsperada = `Bearer ${process.env.SMM_API_KEY}`;
    
    if (!authorization || authorization !== chaveEsperada) {
      console.warn("🔒 Chave inválida:", authorization);
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { rede, tipo, nome, valor, quantidade, link, userId, id_servico, id_acao_smm } = req.body;

    const usuario = await User.findById(userId);
    if (!usuario) {
      return res.status(400).json({ error: "Usuário não encontrado!" });
    }

if (id_servico && typeof id_servico !== "string") {
  return res.status(400).json({ error: "id_servico inválido" });
}

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ error: "Valor inválido" });
    }

    const quantidadeNum = Number(quantidade);
    if (!Number.isInteger(quantidadeNum) || quantidadeNum < 50 || quantidadeNum > 1000000) {
      return res.status(400).json({ error: "A quantidade deve ser um número entre 50 e 1.000.000!" });
    }

const novaAcao = new Action({
  userId: usuario._id,
  id_servico: id_servico ? String(id_servico) : undefined,
  rede,
  tipo,
  nome,
  valor: valorNum,
  quantidade: quantidadeNum,
  validadas: 0,
  link,
  status: "pendente",
  id_acao_smm,
  dataCriacao: new Date()
});

    await novaAcao.save();

    const id_pedido = novaAcao._id.toString();

    const nome_usuario = link.includes("@") ? link.split("@")[1].trim() : link.trim();
    const quantidade_pontos = +(valorNum * 0.001).toFixed(6);

    let tipo_acao = "Outro";
    const tipoLower = tipo.toLowerCase();
    if (tipoLower === "seguidores") tipo_acao = "Seguir";
    else if (tipoLower === "curtidas") tipo_acao = "Curtir";

    const payloadGanheSocial = {
      tipo_acao,
      nome_usuario,
      quantidade_pontos,
      quantidade: quantidadeNum,
      valor: valorNum,
      url_dir: link,
      id_pedido,
      id_acao_smm,
    };

    console.log("➡️ Enviando para ganhesocial.com:", payloadGanheSocial);

    try {
      const response = await fetch("https://ganhesocial.com/api/smm_acao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: chaveEsperada
        },
        body: JSON.stringify(payloadGanheSocial)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("⚠️ Erro na resposta do ganhesocial:", data);
      } else {
        console.log("✅ Ação registrada no ganhesocial:", data);

        // ⬇️ Atualiza a ação local com o id_acao_smm recebido
        if (data.id_acao_smm) {
          await Action.findByIdAndUpdate(novaAcao._id, { id_acao_smm: data.id_acao_smm });
        }
      }
    } catch (erroEnvio) {
      console.error("❌ Falha na comunicação com ganhesocial:", erroEnvio);
    }

    return res.status(201).json({ message: "Ação criada com sucesso", id_pedido });

  } catch (error) {
    console.error("❌ Erro interno ao criar ação:", error);
    return res.status(500).json({ error: "Erro ao criar ação" });
  }
};

export default handler;
