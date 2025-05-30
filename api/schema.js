import mongoose from "mongoose";

/* 🔹 Schema do Usuário */
const userSchema = new mongoose.Schema({
  nome: { type: String },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  token: { type: String, required: true, unique: true }, // Garante token único
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  saldo: { type: Number, default: 0 }
}, {
  timestamps: true // Adiciona createdAt e updatedAt
});

/* 🔹 Histórico de Ações Realizadas */
const actionHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  nome_usuario: { type: String, required: true },
  id_pedido: { type: String, required: true },
  id_conta: { type: String, required: true },
  url_dir: { type: String, required: true },
  tipo_acao: { type: String, required: true },
  quantidade_pontos: { type: Number, required: true },
  tipo: { type: String, default: "Seguir" },
  rede_social: { type: String, default: "TikTok" },
  valor_confirmacao: { type: String, required: true },
  acao_validada: { type: Boolean, default: null },
  data: { type: Date, default: Date.now }
});

/* 🔹 Ações Disponíveis */
const actionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  id_servico: { type: String }, // ou ObjectId, se houver referência
  rede: { type: String, required: true },
  tipo: { type: String, required: true },
  nome: { type: String, required: true },
  valor: { type: Number, required: true },
  quantidade: { type: Number, required: true },
  validadas: { type: Number, default: 0 },
  link: { type: String, required: true },
  status: { type: String, default: "pendente" },
  dataCriacao: { type: Date, default: Date.now },
  id_acao_smm: { type: Number } // Identificador da origem externa, opcional
});

const ServicoSchema = new mongoose.Schema({
    id_servico: {
    type: String, // Ex: "1254"
    required: true
  },
  nome: {
    type: String, // Ex: "🚀 Seguidores RÁPIDO no TikTok"
    required: true
  },
   tipo: {
    type: String, // Ex: "seguindores"
    required: true
  },
  preco_1000: {
    type: Number, // Ex: 10.00
    required: true
  },
  minimo: {
    type: Number, // Ex: 50
    required: true
  },
  maximo: {
    type: Number, // Ex: 1000000
    required: true
  },
  tempo_medio: {
    type: String, // Ex: "10 minutos"
    required: true
  },
  categoria: {
    type: String, // Ex: "TikTok"
    required: true
  },
      descricao: {
    type: String,
    required: true
  }
}, { _id: false }); // Usamos o _id personalizado, então desativamos o autogerado

// 🔄 Previne erro em hot-reload (dev)
mongoose.models = {};

// 🔹 Exportação dos modelos
export const User = mongoose.model("User", userSchema);
export const Action = mongoose.model("Action", actionSchema);
export const ActionHistory = mongoose.model("ActionHistory", actionHistorySchema);
export const Servico = mongoose.model("Servico", ServicoSchema);
