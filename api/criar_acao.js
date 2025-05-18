import connectDB from "./db.js";
import { Action } from "./Action.js";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    await connectDB();

    // 🔐 Validação da chave da API
    const { authorization } = req.headers;
    const chaveEsperada = `Bearer ${process.env.SMM_API_KEY}`;
    
    if (!authorization || authorization !== chaveEsperada) {
      console.warn("🔒 Chave inválida:", authorization);
      return res.status(401).json({ error: "Não autorizado" });
    }

    // 📦 Extração e validação dos dados
    const { rede, tipo, nome, valor, quantidade, link } = req.body;

    if (!rede || !tipo || !nome || !valor || !quantidade || !link) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
    }

    const valorNum = Number(valor);
    const quantidadeNum = Number(quantidade);

    if (!Number.isInteger(quantidadeNum) || quantidadeNum < 50 || quantidadeNum > 1000000) {
      return res.status(400).json({ error: "A quantidade deve ser um número entre 50 e 1.000.000!" });
    }

    if (isNaN(valorNum) || valorNum < 0.01) {
      return res.status(400).json({ error: "O valor deve ser um número válido e positivo!" });
    }

    // 🆕 Criação da ação no banco
    const novaAcao = new Action({
      rede,
      tipo,
      nome,
      valor: valorNum,
      quantidade: quantidadeNum,
      link,
      status: "pendente",
      dataCriacao: new Date()
    });

    await novaAcao.save();

    // 🆔 Usar o _id do MongoDB como identificador universal
    const id_pedido = novaAcao._id.toString();

    // 🔗 Preparação dos dados para envio ao GanheSocial
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
      id_pedido // ✅ Agora é o _id real do Mongo
    };

    console.log("➡️ Enviando para ganhesocial.com:", payloadGanheSocial);

    // 📡 Envio para GanheSocial
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
