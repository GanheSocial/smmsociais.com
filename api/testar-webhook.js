import connectDB from "./db.js";
import { Deposito, User } from "./schema.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { admin_token, payment_id } = req.body;

  // Proteção básica: só admins autorizados podem simular
  if (admin_token !== "seu_token_secreto_aqui") {
    return res.status(403).json({ error: "Acesso negado" });
  }

  if (!payment_id) {
    return res.status(400).json({ error: "payment_id é obrigatório" });
  }

  try {
    await connectDB();

    // Busca dados do pagamento na API do Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      method: "GET",
      headers: {
        Authorization: "Bearer APP_USR-4392638487978504-053020-58385d412bdf3a5b9de74579fd791060-650613572"
      }
    });

    const paymentData = await mpResponse.json();

    if (paymentData.status === "approved") {
      const deposito = await Deposito.findOne({ payment_id });

      if (!deposito) {
        return res.status(404).json({ error: "Depósito não encontrado" });
      }

      if (deposito.status === "completed") {
        return res.status(200).json({ message: "Depósito já estava processado" });
      }

      const user = await User.findOne({ email: deposito.userEmail });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      user.saldo += deposito.amount;
      await user.save();

      deposito.status = "completed";
      await deposito.save();

      return res.status(200).json({ message: "Depósito simulado com sucesso" });
    } else {
      return res.status(200).json({ message: "Pagamento ainda não aprovado" });
    }

  } catch (error) {
    console.error("Erro no teste de webhook:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}
