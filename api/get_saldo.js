import connectDB from "./db.js";
import { User} from "./schema.js";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token ausente' });
    }

    const token = authHeader.split(' ')[1];

    try {
        await connectDB();

        const user = await User.findOne({ token });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        return res.status(200).json({ saldo: user.saldo || 0 });
    } catch (error) {
        console.error('Erro ao buscar saldo:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
