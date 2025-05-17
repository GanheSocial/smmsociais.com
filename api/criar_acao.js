import connectDB from "./db.js";
import { Action } from "./Action.js";

const handler = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        await connectDB();

        // ✅ Validar chave da API
const { authorization } = req.headers;
console.log("Authorization recebido:", authorization);
console.log("Chave esperada:", `Bearer ${process.env.SMM_API_KEY}`);

        if (!authorization || authorization !== `Bearer ${process.env.SMM_API_KEY}`) {
            return res.status(401).json({ error: "Não autorizado" });
        }

        // ✅ Coletar dados
        const { rede, tipo, nome, valor, quantidade, link} = req.body;

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

        console.log("🔍 Criando nova ação...");
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

        // ✅ Preparar envio
        const nome_usuario = link.includes("@") ? link.split("@")[1].trim() : link.trim();
        const quantidade_pontos = +(valorNum * 0.001).toFixed(6);

        let tipo_acao = "Outro";
        if (tipo.toLowerCase() === "seguidores") tipo_acao = "Seguir";
        else if (tipo.toLowerCase() === "curtidas") tipo_acao = "Curtir";

        console.log("➡️ Enviando ação para ganhesocial.com", {
            tipo_acao,
            nome_usuario,
            quantidade_pontos,
            id_pedido: novaAcao._id
        });

        try {
            const response = await fetch("https://ganhesocial.com/api/smm_acao", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.SMM_API_KEY}`,
                },
                body: JSON.stringify({
                    tipo_acao,
                    nome_usuario,
                    quantidade_pontos,
                    quantidade,
                    valor,
                    url_dir: link,
                    id_pedido: novaAcao._id.toString()
                })
            });

            const data = await response.json();
            if (!response.ok) {
                console.error("⚠️ Erro ao enviar para ganhesocial:", data);
            } else {
                console.log("✅ Ação enviada para ganhesocial:", data);
            }
        } catch (erroEnvio) {
            console.error("❌ Falha ao comunicar com ganhesocial:", erroEnvio);
        }

        return res.status(201).json({ message: "Ação criada com sucesso" });

    } catch (error) {
        console.error("❌ Erro ao criar ação:", error);
        return res.status(500).json({ error: "Erro ao criar ação" });
    }
};

export default handler;
