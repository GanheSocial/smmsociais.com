import connectDB from "./db.js";
import { User } from "./User.js";
import { Action } from "./Action.js";

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

        const status = req.query.status; // para filtro opcional

        const filtro = { userId: usuario._id };
        if (status && status !== "todos") {
            filtro.status = status;
        }

        const acoes = await Action.find(filtro).sort({ dataCriacao: -1 });

        return res.json({ acoes });

    } catch (error) {
        console.error("Erro ao buscar histórico de ações:", error);
        return res.status(500).json({ error: "Erro ao buscar histórico de ações" });
    }
};

export default handler;
