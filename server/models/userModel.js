import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  idx: { type: String, required: true },
  tm: { type: String, required: true },
  ofst: { type: String, required: false },
  psalt: { type: String, required: false },
  shares: {type: [String], default:[]},
  rhsh: { type: [String], default: [] }
}, { _id: false });

const userSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  user: { type: String, required: true, unique: true },
  alias: { type: String, default: "" },
  otp: { type: String, default: '' },
  otpExpiry: { type: Number, default: 0 },
  isAccountVerified: { type: Boolean, default: false },
  offset: { type: String, default: "" },
  serv: { type: [serviceSchema], default: [] }
});

userSchema.index({ user: 1, "serv.name": 1 }, { unique: true });
userSchema.index({ user: 1, "serv.idx": 1 }, { unique: true });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;