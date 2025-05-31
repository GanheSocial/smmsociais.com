import { randomUUID } from 'crypto';
import connectDB from "./db.js";
import { Deposito, User} from "./schema.js";

export default async function handler(req, res) {
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
        transaction_amount: parseFloat(amount),
        payment_method_id: "pix",
        description: "Depósito via PIX",
        payer: {
          email: user.email
        }
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
