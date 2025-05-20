import mongoose from "mongoose";

const ServicoSchema = new mongoose.Schema({
  _id: {
    type: String, // Ex: "1254"
    required: true
  },
  nome: {
    type: String, // Ex: "🚀 Seguidores RÁPIDO no TikTok"
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
  }
}, { _id: false }); // Usamos o _id personalizado, então desativamos o autogerado

export default mongoose.models.Servico || mongoose.model("Servico", ServicoSchema);
