// /api/webhook-mercadopago.js
import { buffer } from 'micro';
import { MongoClient, ObjectId } from 'mongodb';

export const config = {
  api: {
    bodyParser: false, // necessário para capturar raw body
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = (await buffer(req)).toString();
  const evento = JSON.parse(rawBody);

  // Verifica se é notificação de pagamento aprovado
  if (evento.type === "payment") {
    try {
      const paymentId = evento.data.id;

      // Requisição à API do Mercado Pago para detalhes
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: "Bearer APP_USR-4392638487978504-053020-58385d412bdf3a5b9de74579fd791060-650613572"
        }
      });

      const paymentData = await mpRes.json();

      if (paymentData.status === "approved") {
        const email = paymentData.payer.email;
        const valor = paymentData.transaction_amount;

        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db();

        // Atualiza o saldo do usuário com base no e-mail do pagador
        await db.collection('usuarios').updateOne(
          { email },
          { $inc: { saldo: valor } }
        );

        client.close();
      }

      return res.status(200).send('OK');
    } catch (err) {
      console.error("Erro ao processar webhook:", err);
      return res.status(500).send('Erro interno');
    }
  }

  return res.status(200).send('Ignorado');
}
