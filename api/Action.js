import mongoose from "mongoose";

const actionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  id_servico: { type: String }, // <- Certifique-se que este campo existe aqui
  rede: { type: String, required: true },
  tipo: { type: String, required: true },
  nome: { type: String, required: true },
  valor: { type: Number, required: true },
  quantidade: { type: Number, required: true },
  link: { type: String, required: true },
  status: { type: String, default: "pendente" },
  dataCriacao: { type: Date, default: Date.now }
});

export const Action = mongoose.models.Action || mongoose.model("Action", actionSchema);
