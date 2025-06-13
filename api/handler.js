import axios from "axios";
import connectDB from "./db.js";
import mongoose from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User, Deposito, Action, ActionHistory, Servico } from "./schema.js";

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

// Rota: /api/massorder
if (url.startsWith("/api/massorder")) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    await connectDB();

    // 🔐 Validação da chave da API
    const { authorization } = req.headers;
    const chaveEsperada = `Bearer ${process.env.SMM_API_KEY}`;

    if (!authorization || authorization !== chaveEsperada) {
      console.warn("🔒 Chave inválida:", authorization);
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { pedidos } = req.body;

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
      return res.status(400).json({ error: "Nenhum pedido enviado." });
    }

    const resultados = [];

    for (const pedido of pedidos) {
      const { rede, tipo, nome, quantidade, link } = pedido;

      // ✅ Validação básica
      if (!rede || !tipo || !nome || !quantidade || !link) {
        resultados.push({ erro: "Campos ausentes no pedido", pedido });
        continue;
      }

      const quantidadeNum = Number(quantidade);

      if (!Number.isInteger(quantidadeNum) || quantidadeNum < 50 || quantidadeNum > 1000000) {
        resultados.push({ erro: "Quantidade fora do intervalo permitido", pedido });
        continue;
      }

      // 🆕 Criação da ação no MongoDB
      const novaAcao = new Action({
        rede,
        tipo,
        nome,
        quantidade: quantidadeNum,
        link,
        status: "pendente",
        dataCriacao: new Date()
      });

      await novaAcao.save();
      const id_pedido = novaAcao._id.toString();

      // 🔗 Preparar dados para envio ao ganhesocial.com
      const nome_usuario = link.includes("@") ? link.split("@")[1].trim() : link.trim();
      const quantidade_pontos = 0.007;

      let tipo_acao = "Outro";
      const tipoLower = tipo.toLowerCase();
      if (tipoLower === "seguidores") tipo_acao = "Seguir";
      else if (tipoLower === "curtidas") tipo_acao = "Curtir";

      const payloadGanheSocial = {
        tipo_acao,
        nome_usuario,
        quantidade_pontos,
        quantidade: quantidadeNum,
        url_dir: link,
        id_pedido,
        valor: 7
      };

      try {
        const response = await fetch("https://ganhesocial.com/api/smm_acao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: chaveEsperada
          },
          body: JSON.stringify(payloadGanheSocial)
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("⚠️ Erro ao enviar ação:", data);
          resultados.push({ erro: "Erro ao enviar ao ganhesocial", id_pedido, motivo: data });
        } else {
          resultados.push({ sucesso: true, id_pedido });
        }
      } catch (erroEnvio) {
        console.error("❌ Erro de rede:", erroEnvio);
        resultados.push({ erro: "Erro de rede ao enviar ao ganhesocial", id_pedido });
      }
    }

    return res.status(200).json({ resultados });

  } catch (error) {
    console.error("❌ Erro interno:", error);
    return res.status(500).json({ error: "Erro ao processar pedidos" });
  }
};

// Rota: /api/incrementar-validadas
if (url.startsWith("/api/incrementar-validadas")) {
  console.log("[incrementar-validadas] chamada recebida");
  console.log("Método:", req.method);
  console.log("Corpo recebido:", req.body);
if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  let { id_acao_smm } = req.body;

  if (!id_acao_smm) {
    console.log("[incrementar-validadas] id_acao_smm ausente ou inválido:", id_acao_smm);
    return res.status(400).json({ error: "ID inválido" });
  }

  // converter para número se for string numérica
  if (typeof id_acao_smm === "string") {
    id_acao_smm = Number(id_acao_smm);
  }

  if (typeof id_acao_smm !== "number" || isNaN(id_acao_smm)) {
    console.log("[incrementar-validadas] id_acao_smm não é número válido:", id_acao_smm);
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    await connectDB();

    const result = await Action.updateOne(
      { id_acao_smm: id_acao_smm },
      { $inc: { validadas: 1 } }
    );

    console.log("[incrementar-validadas] resultado do update:", result);

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Ação não encontrada" });
    }

    return res.status(200).json({ status: "ok", updated: result.modifiedCount });

  } catch (error) {
    console.error("[incrementar-validadas] erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}

// Rota: /api/historico_pedidos
if (url.startsWith("/api/historico_pedidos")) {
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

// Rota: /api/get_saldo
if (url.startsWith("/api/get_saldo")) {
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

// Rota: /api/listar-depositos
if (url.startsWith("/api/listar-depositos")) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    await connectDB();

    const usuario = await User.findOne({ token });
    if (!usuario) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    // ✅ Busca apenas depósitos com status "completed"
    const depositos = await Deposito.find({
      userEmail: usuario.email,
      status: "completed"
    })
    .sort({ createdAt: -1 })
    .limit(10);

    return res.status(200).json(depositos);
  } catch (error) {
    console.error("Erro ao listar depósitos:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Rota: /api/gerar-pagamento
if (url.startsWith("/api/gerar-pagamento")) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { amount, token } = req.body;

  if (!amount || amount < 1 || amount > 1000) {
    return res.status(400).json({ error: "Valor inválido. Min: 1, Max: 1000" });
  }

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  await connectDB();

  const user = await User.findOne({ token });

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  try {
const response = await fetch("https://api.mercadopago.com/v1/payments", {
  method: "POST",
  headers: {
    Authorization: "Bearer APP_USR-4392638487978504-053020-58385d412bdf3a5b9de74579fd791060-650613572",
    "Content-Type": "application/json",
    "X-Idempotency-Key": randomUUID()
  },
  body: JSON.stringify({
    transaction_amount: Number(parseFloat(amount).toFixed(2)),
    payment_method_id: "pix",
    description: "Depósito via PIX",
    payer: {
      email: user.email
    },
    external_reference: user._id.toString()
  })
});

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(500).json({ error: "Erro ao gerar pagamento", detalhes: data });
    }

    const { point_of_interaction, id } = data;

    // 🔽 Salva o registro do depósito no MongoDB
    await Deposito.create({
      userEmail: user.email,
      payment_id: String(id),
      amount: parseFloat(amount),
      status: "pending"
    });

    return res.status(200).json({
      payment_id: id,
      qr_code_base64: point_of_interaction.transaction_data.qr_code_base64,
      qr_code: point_of_interaction.transaction_data.qr_code
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno ao processar pagamento" });
  }
}

 // Rota: /api/recover-password
if (url.startsWith("/api/recover-password")) { 
  if (req.method !== "POST")
    return res.status(405).json({ error: "Método não permitido" });

  const { email } = req.body;
  if (!email)
    return res.status(400).json({ error: "Email é obrigatório" });

  try {
    await connectDB(); // só garante a conexão
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ error: "Email não encontrado" });

    const token = crypto.randomBytes(32).toString("hex");
    
    const expires = Date.now() + 30 * 60 * 1000; // 30 minutos em milissegundos

    // Salva no documento Mongoose
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

    const link = `https://smmsociais.com/reset-password?token=${token}`;
    await sendRecoveryEmail(email, link);

    return res.status(200).json({ message: "Link enviado com sucesso" });
  } catch (err) {
    console.error("Erro em recover-password:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}

    return res.status(404).json({ error: "Rota não encontrada." });
}
