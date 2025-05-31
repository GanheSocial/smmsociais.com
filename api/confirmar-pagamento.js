import connectDB from "./db.js";
import { User} from "./schema.js";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { token, valor } = req.body;

    if (!token || typeof valor !== 'number') {
        return res.status(400).json({ error: 'Dados inválidos' });
    }

    try {
        await connectDB();

        const user = await User.findOne({ token });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Adiciona o valor ao saldo atual
        user.saldo += valor;
        await user.save();

        return res.status(200).json({ saldo: user.saldo });
    } catch (error) {
        console.error('Erro ao atualizar saldo:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
