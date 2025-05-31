// /api/gerar-pagamento.js

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { amount } = req.body;

    if (!amount || amount < 1 || amount > 1000) {
        return res.status(400).json({ error: "Valor inválido. Min: 1, Max: 1000" });
    }

    try {
        const response = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
                Authorization: "Bearer APP_USR-4392638487978504-053020-58385d412bdf3a5b9de74579fd791060-650613572",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                transaction_amount: parseFloat(amount),
                payment_method_id: "pix",
                description: "Depósito via PIX",
                payer: {
                    email: "rennissonn@gmail.com" // pode ser qualquer email válido
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            return res.status(500).json({ error: "Erro ao gerar pagamento", detalhes: data });
        }

        const { point_of_interaction, id } = data;

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
