import mongoose from "mongoose";

const bifrostSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  token: { type: String, required: true },
  user: {type: String, required: true},
  expiresAt: { type: Date, required: true }
});

//TTL index
bifrostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Bifrost || mongoose.model('Bifrost', bifrostSchema);