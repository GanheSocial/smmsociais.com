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

    // 📦 Verifica se a requisição contém um array de pedidos
    const { pedidos } = req.body;

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
      return res.status(400).json({ error: "Nenhum pedido enviado." });
    }

    const resultados = [];

    for (const pedido of pedidos) {
      const { rede, tipo, nome, quantidade, link } = pedido;

      // ✅ Validação básica
      if (!rede || !tipo || !nome || !quantidade || !link) {
        resultados.push({ erro: "Campos ausentes no pedido", pedido });
        continue;
      }

      const quantidadeNum = Number(quantidade);

      if (!Number.isInteger(quantidadeNum) || quantidadeNum < 50 || quantidadeNum > 1000000) {
        resultados.push({ erro: "Quantidade fora do intervalo permitido", pedido });
        continue;
      }

      // 🆕 Criação da ação no MongoDB
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

      const id_pedido = novaAcao._id.toString();

// 🔗 Preparar e enviar para ganhesocial.com
const nome_usuario = link.includes("@") ? link.split("@")[1].trim() : link.trim();
const quantidade_pontos = 0.007; // 🔒 valor fixo

let tipo_acao = "Outro";
const tipoLower = tipo.toLowerCase();
if (tipoLower === "seguidores") tipo_acao = "Seguir";
else if (tipoLower === "curtidas") tipo_acao = "Curtir";

const payloadGanheSocial = {
  tipo_acao,
  nome_usuario,
  quantidade_pontos,
  quantidade: quantidadeNum,
  url_dir: link,
  id_pedido
};

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
          console.error("⚠️ Erro ao enviar ação:", data);
          resultados.push({ erro: "Erro ao enviar ao ganhesocial", id_pedido, motivo: data });
        } else {
          resultados.push({ sucesso: true, id_pedido });
        }
      } catch (erroEnvio) {
        console.error("❌ Erro de rede:", erroEnvio);
        resultados.push({ erro: "Erro de rede ao enviar ao ganhesocial", id_pedido });
      }
    }

    return res.status(200).json({ resultados });

  } catch (error) {
    console.error("❌ Erro interno:", error);
    return res.status(500).json({ error: "Erro ao processar pedidos" });
  }
};

export default handler;
