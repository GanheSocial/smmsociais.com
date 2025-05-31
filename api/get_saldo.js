// /api/get_saldo.js

import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET; // a mesma usada para gerar o token

async function connectToDatabase() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(); // nome já incluído na URI
    return { db, client };
}

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token de autenticação ausente" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        const { db, client } = await connectToDatabase();
        const user = await db.collection("usuarios").findOne({ _id: new ObjectId(userId) });

        await client.close();

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        return res.status(200).json({ saldo: user.saldo || 0 });
    } catch (error) {
        console.error("Erro ao verificar token ou buscar saldo:", error);
        return res.status(500).json({ error: "Erro interno ao buscar saldo" });
    }
}
