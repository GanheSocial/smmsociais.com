import mongoose from "mongoose";

// 🔹 Schema do Usuário
const UserSchema = new mongoose.Schema({
  nome: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  token: { type: String, required: true, unique: true }, // 🔒 Sugestão: garantir token único
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  saldo: { type: Number, default: 0 }
}, {
  timestamps: true // 🕒 Sugestão: adiciona createdAt e updatedAt automaticamente
});

// 🔹 Exportação do modelo
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export { User };
