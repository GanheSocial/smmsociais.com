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

        const { id } = req.query;

        if (id) {
            // Busca por ID específico
            const acao = await Action.findById(id);

            if (!acao) {
                return res.status(404).json({ status: 'NAO_ENCONTRADA', message: 'Ação com esse ID não foi encontrada.' });
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
                quantidadeExecutada: acao.quantidadeExecutada,
                link: acao.link,
                dataCriacao: acao.dataCriacao
            });
        }

        // Caso não tenha sido passado um ID, retorna a próxima pendente
        const acao = await Action.findOne(
            { status: 'pendente' },
            null,
            { sort: { dataCriacao: 1 } }
        );

        if (!acao) {
            return res.json({ status: 'NAO_ENCONTRADA' });
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
            quantidadeExecutada: acao.quantidadeExecutada,
            link: acao.link,
            dataCriacao: acao.dataCriacao
        });

    } catch (error) {
        console.error('Erro ao buscar ação disponível:', error);
        return res.status(500).json({ error: 'Erro interno' });
    }
}
