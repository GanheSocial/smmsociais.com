import connectDB from "./db.js";
import { Action } from "./Action.js";

const API_KEY = process.env.SMM_API_KEY;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    try {
        await connectDB();

        // Busca uma ação que ainda pode ser executada (não excedeu a quantidade)
        const acao = await Action.findOneAndUpdate(
            {
                status: 'pendente',
                $expr: { $lt: ["$quantidadeExecutada", "$quantidade"] }
            },
            { $inc: { quantidadeExecutada: 1 } },
            { sort: { dataCriacao: 1 }, new: true }
        );

        if (!acao) {
            return res.json({ status: 'NAO_ENCONTRADA' });
        }

        // Se atingiu o limite após o incremento, marca como concluída
        if (acao.quantidadeExecutada + 1 >= acao.quantidade) {
            await Action.updateOne({ _id: acao._id }, { status: 'concluida' });
        }

        return res.json({
            status: 'ENCONTRADA',
            _id: acao._id,
            userId: acao.userId,
            rede: acao.rede,
            tipo: acao.tipo,
            nome: acao.nome,
            valor: acao.valor,
            quantidade: acao.quantidade,
            quantidadeExecutada: acao.quantidadeExecutada + 1,
            link: acao.link,
            dataCriacao: acao.dataCriacao
        });

    } catch (error) {
        console.error('Erro ao buscar ação disponível:', error);
        return res.status(500).json({ error: 'Erro interno' });
    }
}
