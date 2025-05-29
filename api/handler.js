import axios from "axios";
import connectDB from "./db.js";
import mongoose from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User, Action, ActionHistory } from "./schema.js";

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

    // ❌ Caso nenhuma rota seja correspondida
    return res.status(404).json({ error: "Rota não encontrada." });
}
