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

        if (!rede || !tipo || !nome || !valor|| !quantidade || !link) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
        }

        console.log("🔍 Criando nova ação...");
        const novaAcao = new Action({
            userId: usuario._id,
            rede,
            tipo,
            nome,
            valor,
            quantidade,
            link,
            status: "pendente", // status inicial da ação
            dataCriacao: new Date()
        });

        await novaAcao.save();
        console.timeLog("⏱️ Tempo total de criação de ação", "✔️ Ação salva");

        console.timeEnd("⏱️ Tempo total de criação de ação");
        return res.json({ message: "Ação criada com sucesso!", acao: novaAcao });

    } catch (error) {
        console.error("❌ Erro ao criar ação:", error);
        return res.status(500).json({ error: "Erro ao criar ação" });
    }
};

export default handler;
