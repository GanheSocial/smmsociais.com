import mongoose from "mongoose";

const actionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  id_servico: { type: String }, // ou ObjectId se quiser referenciar outra coleção
  rede: { type: String, required: true },
  tipo: { type: String, required: true },
  nome: { type: String, required: true },
  valor: { type: Number, required: true },
  quantidade: { type: Number, required: true },
  validadas: { type: Number, default: 0 },
  link: { type: String, required: true },
  status: { type: String, default: "pendente" },
  dataCriacao: { type: Date, default: Date.now },

  // 👇 Novo campo para vincular à actionhistory
 id_acao_smm: { type: Number, required: false }
});

// 👇 Força o Mongoose a recriar o modelo se ele já existir (evita cache em dev)
delete mongoose.models.Action;

export const Action = mongoose.model("Action", actionSchema);
