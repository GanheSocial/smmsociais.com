import { Deposito, User} from "./schema.js";
import connectDB from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  await connectDB();

  try {
    const { type, data } = req.body;

    // Só processa pagamentos
    if (type !== "payment" || !data?.id) {
      return res.status(200).end(); // ignora notificações irrelevantes
    }

    const paymentId = data.id;

    // 🔍 Consulta detalhes do pagamento no Mercado Pago
    const mercadopagoRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: "Bearer APP_USR-4392638487978504-053020-58385d412bdf3a5b9de74579fd791060-650613572"
      }
    });

    const paymentData = await mercadopagoRes.json();

    if (!mercadopagoRes.ok || !paymentData.id) {
      console.error("Erro ao consultar pagamento:", paymentData);
      return res.status(500).end();
    }

    // Só processa se foi aprovado
    if (paymentData.status !== "approved") {
      return res.status(200).end(); // ignora outros status
    }

    const existing = await Deposito.findOne({ payment_id: String(paymentData.id) });

    if (!existing) {
      console.warn("Pagamento não registrado previamente:", paymentData.id);
      return res.status(404).end();
    }

    if (existing.status === "approved") {
      return res.status(200).end(); // já processado
    }

    // Atualiza status e credita saldo
    await Deposito.updateOne({ _id: existing._id }, { status: "approved" });

    await User.updateOne(
      { email: existing.userEmail },
      { $inc: { saldo: existing.amount } }
    );

    return res.status(200).end();
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).end();
  }
}
