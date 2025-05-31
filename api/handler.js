import axios from "axios";
import connectDB from "./db.js";
import mongoose from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User, Action, ActionHistory, Servico } from "./schema.js";

export default async function handler(req, res) {
    await connectDB(); // 🟢 Conectar ao banco antes de qualquer operação

    const { method, url } = req;

    // ✅ Rota: /api/buscar_acao_disponivel (POST)
    if (url.startsWith("/api/buscar_acao_disponivel") && method === "POST") {
        try {
            const { id } = req.query;

            if (id) {
                const acao = await Action.findById(id);
                if (!acao) {
                    return res.status(404).json({ status: 'NAO_ENCONTRADA', message: 'Ação com esse ID não foi encontrada.' });
                }

                const execucoes = await ActionHistory.countDocuments({
                    id_pedido: acao._id,
                    acao_validada: { $in: [null, true, "true"] }
                });

                if (execucoes >= acao.quantidade) {
                    return res.status(403).json({ status: 'LIMITE_ATINGIDO', message: 'Limite de execuções já atingido para esta ação.' });
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
                    quantidadeExecutada: execucoes,
                    link: acao.link,
                    dataCriacao: acao.dataCriacao
                });
            }

            // 🔁 Buscar primeira ação pendente válida
            const acoesPendentes = await Action.find({ status: 'pendente' }).sort({ dataCriacao: 1 });

            for (const acao of acoesPendentes) {
                const execucoes = await ActionHistory.countDocuments({
                    id_pedido: acao._id,
                    acao_validada: { $in: [null, true, "true"] }
                });

                if (execucoes < acao.quantidade) {
                    return res.json({
                        status: 'ENCONTRADA',
                        _id: acao._id,
                        userId: acao.userId,
                        rede: acao.rede,
                        tipo: acao.tipo,
                        nome: acao.nome,
                        valor: acao.valor,
                        quantidade: acao.quantidade,
                        quantidadeExecutada: execucoes,
                        link: acao.link,
                        dataCriacao: acao.dataCriacao
                    });
                }
            }

            return res.json({ status: 'NAO_ENCONTRADA' });

        } catch (error) {
            console.error('Erro ao buscar ação disponível:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    // ✅ Rota: /api/login (POST)
    if (url.startsWith("/api/login") && method === "POST") {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({ error: "E-mail e senha são obrigatórios!" });
            }

            const usuario = await User.findOne({ email });

            if (!usuario) {
                console.log("🔴 Usuário não encontrado!");
                return res.status(400).json({ error: "Usuário não encontrado!" });
            }

            if (senha !== usuario.senha) {
                console.log("🔴 Senha incorreta!");
                return res.status(400).json({ error: "Senha incorreta!" });
            }

            let token = usuario.token;
            if (!token) {
                token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET);
                usuario.token = token;
                await usuario.save({ validateBeforeSave: false });

                console.log("🟢 Novo token gerado e salvo.");
            } else {
                console.log("🟢 Token já existente mantido.");
            }

            console.log("🔹 Token gerado para usuário:", token);
            return res.json({ message: "Login bem-sucedido!", token });

        } catch (error) {
            console.error("❌ Erro ao realizar login:", error);
            return res.status(500).json({ error: "Erro ao realizar login" });
        }
    }

// Rota: /api/signup
if (url.startsWith("/api/signup")) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido." });
    }

    await connectDB();

    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    try {

        const emailExiste = await User.findOne({ email });
        if (emailExiste) {
            return res.status(400).json({ error: "E-mail já está cadastrado." });
        }

        // Gerar token único
        const token = crypto.randomBytes(32).toString("hex");

        const novoUsuario = new User({ email, senha, token });
        await novoUsuario.save();

        return res.status(201).json({ message: "Usuário registrado com sucesso!", token });
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        return res.status(500).json({ error: "Erro interno ao registrar usuário. Tente novamente mais tarde." });
    }
};

// Rota: /api/profile (GET ou PUT)
if (url.startsWith("/api/profile")) {
  if (method !== "GET" && method !== "PUT") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  await connectDB();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const token = authHeader.split(" ")[1].trim();
  console.log("🔐 Token recebido:", token);

  try {
    const usuario = await User.findOne({ token });
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
 
    if (method === "GET") {
      let actionHistory = null;

      if (usuario.historico_acoes?.length > 0) {
        actionHistory = await ActionHistory.findOne({
          _id: { $in: usuario.historico_acoes }
        }).sort({ data: -1 });
      }

      return res.status(200).json({
        nome_usuario: usuario.nome,
        email: usuario.email,
        token: usuario.token
      });
    }

    if (method === "PUT") {
      const { nome_usuario, email, senha } = req.body;

      const updateFields = { nome: nome_usuario, email };
      if (senha) {
        updateFields.senha = senha; // ⚠️ Criptografar se necessário
      }

      const usuarioAtualizado = await User.findOneAndUpdate(
        { token },
        updateFields,
        { new: true }
      );

      if (!usuarioAtualizado) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      return res.status(200).json({ message: "Perfil atualizado com sucesso!" });
    }
  } catch (error) {
    console.error("💥 Erro ao processar /profile:", error);
    return res.status(500).json({ error: "Erro ao processar perfil." });
  }
}

// Rota: /api/confirmar-pagamento
if (url.startsWith("/api/confirmar-pagamento")) {   
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

    // 🔄 Atualizar status automaticamente:
    // De "pendente" para "progress" se validadas > 0
    await Action.updateMany(
      { status: "pendente", validadas: { $gt: 0 } },
      { $set: { status: "progress" } }
    );

    // De "pendente" ou "progress" para "completed" se validadas === quantidade
    await Action.updateMany(
      { status: { $in: ["pendente", "progress"] }, $expr: { $eq: ["$validadas", "$quantidade"] } },
      { $set: { status: "completed" } }
    );

    // 🔎 Filtro dinâmico conforme status da query
    const status = req.query.status;
    const filtro = { userId: usuario._id };

    if (status && status !== "todos") {
      if (status === "pending") {
        filtro.validadas = 0;
      } else if (status === "progress") {
        filtro.validadas = { $gt: 0 };
        filtro.status = "progress";
      } else {
        filtro.status = status;
      }
    }

    // 🔍 Buscar ações do usuário
    const acoes = await Action.find(filtro).sort({ dataCriacao: -1 });

    // 🔗 Buscar os serviços relacionados
    const idsServico = [...new Set(acoes.map(a => a.id_servico))];
    const servicos = await Servico.find({ id_servico: { $in: idsServico } });

    // 🧩 Anexar detalhes dos serviços a cada ação
    const acoesComDetalhes = acoes.map(acao => {
      const obj = acao.toObject();
      obj.servicoDetalhes = servicos.find(s => s.id_servico === obj.id_servico) || null;
      return obj;
    });

    return res.json({ acoes: acoesComDetalhes });

  } catch (error) {
    console.error("Erro ao buscar histórico de ações:", error);
    return res.status(500).json({ error: "Erro ao buscar histórico de ações" });
  }
};

    return res.status(404).json({ error: "Rota não encontrada." });
}
