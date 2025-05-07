import connectDB from "./db.js";
import { User } from "./User.js";
import { Action } from "./Action.js";
import jwt from "jsonwebtoken";

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
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: "Token inválido" });
        }

        const { rede, tipo, nome, valor, link } = req.body;

        if (!rede || !tipo || !nome || !valor || !link) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
        }

        console.log("🔍 Buscando usuário...");
        const usuario = await User.findById(payload.id);
        if (!usuario) {
            return res.status(400).json({ error: "Usuário não encontrado!" });
        }

        const novaAcao = new Action({
            userId: usuario._id,
            rede,
            tipo,
            nome,
            valor,
            link,
            status: "disponível", // status inicial da ação
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
