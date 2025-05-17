import connectDB from "./db.js";
import { User } from "./User.js";
import { Action } from "./Action.js";

const handler = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        console.time("⏱️ Tempo total de criação de ação");
        await connectDB();
        console.timeLog("⏱️ Tempo total de criação de ação", "✔️ Conectado ao MongoDB");

        const { authorization } = req.headers;
        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Token não fornecido" });
        }

        const token = authorization.split(" ")[1];
        const usuario = await User.findOne({ token });

        if (!usuario) {
            return res.status(401).json({ error: "Token inválido ou usuário não encontrado!" });
        }

        const { rede, tipo, nome, valor, quantidade, link } = req.body;

        if (!rede || !tipo || !nome || !valor || !quantidade || !link) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
        }

        // Convertendo para número
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
            userId: usuario._id,
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
        console.timeLog("⏱️ Tempo total de criação de ação", "✔️ Ação salva");

        // Preparando dados para enviar para ganhesocial.com
        const nome_usuario = link.includes("@") ? link.split("@")[1].trim() : link.trim();
        const quantidade_pontos = +(valorNum * 0.001).toFixed(6);

        let tipo_acao;
        if (tipo.toLowerCase() === "seguidores") {
            tipo_acao = "Seguir";
        } else if (tipo.toLowerCase() === "curtidas") {
            tipo_acao = "Curtir";
        } else {
            tipo_acao = "Outro";
        }

        try {
            const response = await fetch("https://ganhesocial.com/api/smm_acao", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.JWT_SECRET}`,
                },
                body: JSON.stringify({
                    tipo_acao,
                    nome_usuario,
                    quantidade_pontos,
                    quantidade: quantidadeNum,
                    valor: valorNum,
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
