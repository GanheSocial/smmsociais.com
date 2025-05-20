import { conectarAoBanco } from '@/utils/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Não autorizado' });
  }

  const token = authHeader.split(' ')[1];

  let usuarioId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    usuarioId = decoded.id;
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido' });
  }

  const { pedidos } = req.body;

  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    return res.status(400).json({ erro: 'Nenhum pedido enviado' });
  }

  try {
    const { db } = await conectarAoBanco();
    const colecaoAcoes = db.collection('acoes');

    const documentos = pedidos.map(p => {
      return {
        id_usuario: usuarioId,
        id_servico: p.serviceId,
        link: p.profileUrl,
        quantidade: p.quantity,
        quantidade_restante: p.quantity,
        status: 'disponivel',
        data_criacao: new Date()
      };
    });

    await colecaoAcoes.insertMany(documentos);

    return res.status(200).json({ sucesso: true });
  } catch (erro) {
    console.error('Erro ao criar pedidos em massa:', erro);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}
