import mongoose from "mongoose";

const actionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rede: String,
  tipo: String,
  nome: String,
  valor: String,
  quantidade: { type: Number, required: true },
  quantidadeExecutada: { type: Number, default: 0 },
  link: String,
  status: { type: String, enum: ["pendente", "reservada", "concluida"], default: "pendente" },
  dataCriacao: { type: Date, default: Date.now }
});

export const Action = mongoose.models.Action || mongoose.model("Action", actionSchema);
