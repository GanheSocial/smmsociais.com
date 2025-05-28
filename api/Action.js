import mongoose from "mongoose";

const actionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  id_servico: { type: String },
  rede: String,
  tipo: String,
  nome: String,
  valor: Number, // Recomendo alterar para Number, já que no criar_acao você usa parseFloat
  quantidade: { type: Number, required: true },
  quantidadeExecutada: { type: Number, default: 0 },
  link: String,
  status: { type: String, enum: ["pendente", "reservada", "concluida"], default: "pendente" },
  dataCriacao: { type: Date, default: Date.now }
});

export const Action = mongoose.models.Action || mongoose.model("Action", actionSchema);
