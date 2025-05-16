import mongoose from "mongoose";

const actionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rede: String,
    tipo: String,
    nome: String,
    valor: Number,
    quantidade: { type: Number, required: true },           // Total de vezes que essa ação deve ser executada
    link: String,
    status: { type: String, enum: ["pendente", "reservada", "concluida"], default: "pendente" },
    dataCriacao: { type: Date, default: Date.now }
});

export const Action = mongoose.models.Action || mongoose.model("Action", actionSchema);
