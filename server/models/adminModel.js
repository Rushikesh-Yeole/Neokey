import mongoose from "mongoose";

const trendSubSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  trends: { type: Map, of: { type: Number, default: 0 }, default: {} },
}, { _id: false });

const engagementSubSchema = new mongoose.Schema({
  login: { type: Number, default: 0 },
  reset: { type: Number, default: 0 },
  bifrost: { type: Number, default: 0 },
}, { _id: false });

const statsSchema = new mongoose.Schema({
  retrievals: trendSubSchema,
  creations: trendSubSchema,
  engagementTrends: { type: Map, of: engagementSubSchema, default: {} },
  active: { type: Map, of: { type: [String], default: [] }, default: {} },
}, { minimize: false });

export default mongoose.models.admin || mongoose.model('admin', statsSchema);
