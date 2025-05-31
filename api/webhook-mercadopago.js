import connectDB from "./db.js";
import { Deposito, User} from "./schema.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { action, data, type } = req.body;

    // Só trata eventos do tipo "payment" e ação "payment.updated"
    if (type !== "payment" || action !== "payment.updated") {
      return res.status(200).json({ message: "Evento ignorado" });
    }

    await connectDB();

    const pagamentoID = String(data.id);

    // Aqui, consulta os dados completos do pagamento usando a API do Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${pagamentoID}`, {
      method: "GET",
      headers: {
        Authorization: "Bearer APP_USR-4392638487978504-053020-58385d412bdf3a5b9de74579fd791060-650613572"
      }
    });

    const paymentData = await mpResponse.json();

    if (paymentData.status === "approved") {
      const deposito = await Deposito.findOne({ payment_id: pagamentoID });

      if (!deposito) {
        return res.status(404).json({ error: "Depósito não encontrado" });
      }

      if (deposito.status === "completed") {
        return res.status(200).json({ message: "Depósito já processado" });
      }

      const user = await User.findOne({ email: deposito.userEmail });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      user.saldo += deposito.amount;
      await user.save();

      deposito.status = "completed";
      await deposito.save();

      return res.status(200).json({ message: "Depósito confirmado com sucesso" });
    }

    return res.status(200).json({ message: "Pagamento ainda não aprovado" });

  } catch (error) {
    console.error("Erro no webhook do Mercado Pago:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}
