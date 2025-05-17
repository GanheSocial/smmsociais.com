import mongoose from "mongoose";

const actionHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  token: { type: String, required: false },
  nome_usuario: { type: String, required: true },
  id_pedido: { type: String, required: true }, // Alterado de ObjectId para String
  id_conta: { type: String, required: false }, // Agora opcional
  url_dir: { type: String, required: true },
  tipo_acao: { type: String, required: true },
  quantidade_pontos: { type: Number, required: true },
  tipo: { type: String, default: "Seguir" },
  rede_social: { type: String, default: "TikTok" },
  valor_confirmacao: { type: Number, default: 0 }, // Alterado de String para Number
  acao_validada: { type: Boolean, default: null },
  data: { type: Date, default: Date.now }
});

export const ActionHistory =
  mongoose.models.ActionHistory || mongoose.model("ActionHistory", actionHistorySchema);
