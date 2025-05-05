import mongoose from "mongoose";

// 🔹 Schema do Usuário
const UserSchema = new mongoose.Schema({
  nome: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  token: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  saldo: { type: Number, default: 0 },
});

// 🔹 Exportação dos modelos
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export { User };
