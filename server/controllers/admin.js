import userModel from "../models/userModel.js";
import adminModel from "../models/adminModel.js";
import transporter from "../config/nodemailer.js";
import redis from "../models/redisClient.js";
import { Parser } from "json2csv";
import cron from "node-cron";

const dateKey = () => {
  const d = new Date();
  return [d.getDate(), d.getMonth() + 1, d.getFullYear()]
    .map(n => String(n).padStart(2, '0')).join("-");
};

// ------------------- BUFFERED INCREMENT -------------------

const updateBuffer = async ({ type, action }) => {
  const key = "statsCache";
  const date = dateKey();
  const raw = await redis.get(key);
  let buffer = raw ? JSON.parse(raw) : {
    retrievals: { total: 0, trends: {} },
    creations: { total: 0, trends: {} },
    engagementTrends: {}
  };

  if (type === "retrievals" || type === "creations") {
    buffer[type].total += 1;
    buffer[type].trends[date] = (buffer[type].trends[date] || 0) + 1;
  } else if (type === "engagement") {
    buffer.engagementTrends[date] ??= { login: 0, reset: 0, bifrost: 0 };
    buffer.engagementTrends[date][action] += 1;
  }

  await redis.set(key, JSON.stringify(buffer));
};

// ------------------- CACHE FLUSH TO DB -------------------

export const flushStatsCache = async () => {
  const key = "statsCache";
  let raw = await redis.get(key);
  if (!raw) { return;}  
  let buffer = JSON.parse(raw);
  let inc = {};

  for (const t of ["retrievals", "creations"]) {
    inc[`${t}.total`] = buffer[t].total;
    for (const [date, val] of Object.entries(buffer[t].trends))
      inc[`${t}.trends.${date}`] = val;
  }

  for (const [date, obj] of Object.entries(buffer.engagementTrends))
    for (const [a, v] of Object.entries(obj))
      inc[`engagementTrends.${date}.${a}`] = v;

  await adminModel.updateOne({}, { $inc: inc }, { upsert: true });
  await redis.del(key);
};

cron.schedule("*/7 * * * *", () => flushStatsCache().catch(console.error));

// ------------------- ROUTES -------------------

export const retrieved = (req, res) =>
  updateBuffer({ type: "retrievals" }).then(() => res.sendStatus(200)).catch(() => res.sendStatus(500));

export const created = (req, res) =>
  updateBuffer({ type: "creations" }).then(() => res.sendStatus(200)).catch(() => res.sendStatus(500));

export const engaged = (req, res) => {
  let { action } = req.body;
  if (!["login", "reset", "bifrost"].includes(action))
    return res.status(400).send({ message: "Invalid action" });

  updateBuffer({ type: "engagement", action })
    .then(() => res.sendStatus(200))
    .catch(e => res.status(500).json({ message: "Engagement error", error: e.message }));
};

export const getStats = async (req, res) => {
  try {
    // await flushStatsCache();
    const [stats, userCount] = await Promise.all([
      adminModel.findOne({}).lean(),
      userModel.countDocuments()
    ]);

    const trends = Object.entries(stats?.engagementTrends || {})
      .sort(([a], [b]) =>
        new Date(a.split("-").reverse().join("-")) -
        new Date(b.split("-").reverse().join("-")))
      .slice(-90);

    res.json({
      userCount: Math.floor(Number(userCount+49) / 50) * 50 || 0,
      retrievals: stats?.retrievals?.total || 0,
      creations: stats?.creations?.total || 0,
      engagementTrends: Object.fromEntries(trends),
    });
  } catch (e) {
    res.status(500).json({ message: "Error fetching stats", error: e.message });
  }
};

export const resetStats = async (req, res) => {
  const date = dateKey(), filename = `stats-${date}.csv`;
  try {
    await flushStatsCache();
    const s = await adminModel.findOne().lean(), trends = s.engagementTrends || {};
    const summary = [
      { Metric: "Total Retrievals", Value: s.retrievals.total },
      { Metric: "Total Creations",  Value: s.creations.total },
      { Metric: "Total Login",      Value: Object.values(trends).reduce((a, e) => a + e.login, 0) },
      { Metric: "Total Reset",      Value: Object.values(trends).reduce((a, e) => a + e.reset, 0) },
      { Metric: "Total Bifrost",    Value: Object.values(trends).reduce((a, e) => a + e.bifrost, 0) },
    ];

    const dates = [...new Set([
      ...Object.keys(s.retrievals.trends || {}),
      ...Object.keys(s.creations.trends || {}),
      ...Object.keys(trends),
    ])].sort((a, b) =>
      new Date(a.split("-").reverse().join("-")) -
      new Date(b.split("-").reverse().join("-"))
    );

    const table = dates.map(d => ({
      Date: d,
      Retrievals: s.retrievals.trends?.[d] || 0,
      Creations: s.creations.trends?.[d] || 0,
      Login: trends[d]?.login || 0,
      Reset: trends[d]?.reset || 0,
      Bifrost: trends[d]?.bifrost || 0,
    }));

    const rows = Array.from(
      { length: Math.max(summary.length, table.length) },
      (_, i) => ({
        Date:       table[i]?.Date       || "",
        Retrievals: table[i]?.Retrievals || "0",
        Creations:  table[i]?.Creations  || "0",
        Login:      table[i]?.Login      || "0",
        Reset:      table[i]?.Reset      || "0",
        Bifrost:    table[i]?.Bifrost    || "0",
        "":         "",
        Metric:     summary[i]?.Metric   || "",
        Value:      summary[i]?.Value    || "0",
      })
    );

    const csv = new Parser({
      fields: ["Date", "Retrievals", "Creations", "Login", "Reset", "Bifrost", "", "Metric", "Value"]
    }).parse(rows);

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: process.env.SENDER_EMAIL,
      subject: `Stats Backup ${date}`,
      attachments: [{ filename, content: csv, contentType: "text/csv" }],
    });

    await adminModel.updateOne({}, { $set: {
      "retrievals.total": 0,
      "retrievals.trends": {},
      "creations.total": 0,
      "creations.trends": {},
      engagementTrends: {}
    }});

    await redis.del("statsCache");
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
