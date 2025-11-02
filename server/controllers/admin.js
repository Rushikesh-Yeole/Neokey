import userModel from "../models/userModel.js";
import adminModel from "../models/adminModel.js";
import transporter from "../config/nodemailer.js";
import redis from "../models/redisClient.js";
import { Parser } from "json2csv";
import cron from "node-cron";
import { mailAccess } from "./cache.js";
import {bhash} from "./magic.js";

const dateKey = () => {
  const d = new Date();
  return [d.getDate(), d.getMonth() + 1, d.getFullYear()]
    .map(n => String(n).padStart(2, '0'))
    .join("-");
};

const ACTIVE_PREFIX = "stats:active:";
// const ACTIVE_TTL_SECONDS = 60 * 60 * 24 * 90;

// ----------------- BUFFERED INCREMENT -----------------
const updateBuffer = async ({ type, action, userId }) => {
  const key = "statsCache";
  const date = dateKey();

  if (type === "retrievals" || type === "creations" || type === "engagement") {
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
    return;
  }

  if (type === "active") {
    if (!userId) throw new Error("userId required for active");
    const activeKey = `${ACTIVE_PREFIX}${date}`;
    await redis.sadd(activeKey, userId);
    // await redis.expire(activeKey, ACTIVE_TTL_SECONDS);
  }
};

// ----------------- FLUSH CACHE TO DB -----------------
export const flushStatsCache = async () => {
  const key = "statsCache";
  let raw = await redis.get(key);
  const buffer = raw ? JSON.parse(raw) : null;

  const inc = {};
  const addToSet = {};
  const activeKeysToDelete = [];

  if (buffer) {
    for (const t of ["retrievals", "creations"]) {
      if (buffer[t]?.total) inc[`${t}.total`] = buffer[t].total;
      for (const [date, val] of Object.entries(buffer[t]?.trends || {})) {
        inc[`${t}.trends.${date}`] = val;
      }
    }

    for (const [date, obj] of Object.entries(buffer.engagementTrends || {})) {
      for (const [a, v] of Object.entries(obj)) {
        inc[`engagementTrends.${date}.${a}`] = v;
      }
    }
  }

  let cursor = "0";
  const pattern = `${ACTIVE_PREFIX}*`;
  do {
    const [c, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = c;
    for (const k of keys || []) {
      const date = k.slice(ACTIVE_PREFIX.length);
      const members = await redis.smembers(k);
      if (members?.length) {
        addToSet[`active.${date}`] = { $each: members };
        activeKeysToDelete.push(k);
      }
    }
  } while (cursor !== "0");

  const update = {};
  if (Object.keys(inc).length) update.$inc = inc;
  if (Object.keys(addToSet).length) update.$addToSet = addToSet;

  if (Object.keys(update).length) {
    await adminModel.updateOne({}, update, { upsert: true });
  }

  // redis cleanup
  if (buffer) await redis.del(key);
  if (activeKeysToDelete.length) await redis.del(...activeKeysToDelete);
};

// ----------------- CRON -----------------
cron.schedule("*/7 * * * *", () => flushStatsCache().catch(console.error));

// ----------------- ROUTES -----------------
export const retrieved = () =>
  updateBuffer({ type: "retrievals" }).catch(error => console.error("[stats/ retrievals Update Error]", error));

export const created = () =>
  updateBuffer({ type: "creations" }).catch(error => console.error("[stats/ creations Update Error]", error));

export const engaged = (action) => {
  // const { action } = req.body;
  if (!["login", "reset", "bifrost"].includes(action)){
    console.error("Not a valid engagement");
    return
  }
  updateBuffer({ type: "engagement", action }).catch(error => console.error("[stats/ engagement Update Error]", error));
};

export const active = async (userId) => {
  if (!userId) return;
  userId=bhash(userId);
  try { await updateBuffer({ type: "active", userId }); }
  catch (e) { console.error("Active error:", e.message); }
};

// ----------------- GET STATS -----------------
export const getStats = async (req, res) => {
  try {
    const [stats, userCount] = await Promise.all([
      adminModel.findOne({}).lean(),
      userModel.countDocuments()
    ]);

    // Engagement trends (last 90 days)
    const engagementEntries = Object.entries(stats?.engagementTrends || {})
      .sort(([a], [b]) => new Date(a.split("-").reverse().join("-")) - new Date(b.split("-").reverse().join("-")))
      .slice(-90);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const weeklyActiveUsers = new Set();
    const monthlyActiveUsers = new Set();
    const activeData = stats?.active || {};

    for (const [dateStr, userIds] of Object.entries(activeData)) {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        continue;
      }

      const [day, month, year] = dateStr.split('-').map(Number);
      const entryDate = new Date(year, month - 1, day);

      if (entryDate >= thirtyDaysAgo) {
        userIds.forEach(id => monthlyActiveUsers.add(id));

        if (entryDate >= sevenDaysAgo) {
          userIds.forEach(id => weeklyActiveUsers.add(id));
        }
      }
    }

    res.json({
      userCount: Math.floor(Number(userCount + 49) / 50) * 50 || 0,
      retrievals: stats?.retrievals?.total || 0,
      creations: stats?.creations?.total || 0,
      engagementTrends: Object.fromEntries(engagementEntries),
      wau: weeklyActiveUsers.size,
      mau: monthlyActiveUsers.size,
    });
  } catch (e) {
    res.status(500).json({ message: "Error fetching stats", error: e.message });
  }
};

// ----------------- RESET STATS -----------------
export const resetStats = async (req, res) => {
  const date = dateKey();
  const filename = `stats-${date}.csv`;

  try {
    await flushStatsCache();

    const s = await adminModel.findOne().lean() || {};
    const trends = s.engagementTrends || {};
    const active = s.active || {};

    const totalLogin = Object.values(trends).reduce((a, e) => a + (e.login || 0), 0);
    const totalReset = Object.values(trends).reduce((a, e) => a + (e.reset || 0), 0);
    const totalBifrost = Object.values(trends).reduce((a, e) => a + (e.bifrost || 0), 0);

    // Unique active users across all dates
    const uniqueActive = new Set();
    for (const arr of Object.values(active || {})) {
      if (Array.isArray(arr)) arr.forEach(id => uniqueActive.add(id));
    }

    const summary = [
      { Metric: "Total Retrievals", Value: s.retrievals?.total || 0 },
      { Metric: "Total Creations", Value: s.creations?.total || 0 },
      { Metric: "Total Login", Value: totalLogin },
      { Metric: "Total Reset", Value: totalReset },
      { Metric: "Total Bifrost", Value: totalBifrost },
      { Metric: "Total Active Users", Value: uniqueActive.size }
    ];

    // Prepare table per date
    const dates = [...new Set([
      ...Object.keys(s.retrievals?.trends || {}),
      ...Object.keys(s.creations?.trends || {}),
      ...Object.keys(trends),
      ...Object.keys(active || {}),
    ])].sort((a, b) => new Date(a.split("-").reverse().join("-")) - new Date(b.split("-").reverse().join("-")));

    const table = dates.map(d => ({
      Date: d,
      Retrievals: s.retrievals?.trends?.[d] || 0,
      Creations: s.creations?.trends?.[d] || 0,
      Login: trends[d]?.login || 0,
      Reset: trends[d]?.reset || 0,
      Bifrost: trends[d]?.bifrost || 0,
      ActiveCount: Array.isArray(active[d]) ? active[d].length : 0
    }));

    const rows = Array.from(
      { length: Math.max(summary.length, table.length) },
      (_, i) => ({
        Date: table[i]?.Date || "",
        Retrievals: table[i]?.Retrievals || "0",
        Creations: table[i]?.Creations || "0",
        Login: table[i]?.Login || "0",
        Reset: table[i]?.Reset || "0",
        Bifrost: table[i]?.Bifrost || "0",
        ActiveCount: table[i]?.ActiveCount || "0",
        "": "",
        Metric: summary[i]?.Metric || "",
        Value: summary[i]?.Value || "0"
      })
    );

    const csv = new Parser({
      fields: ["Date","Retrievals","Creations","Login","Reset","Bifrost","ActiveUsers","","Metric","Value"]
    }).parse(rows);

    // Send CSV backup to admin
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: process.env.SENDER_EMAIL,
      subject: `Stats Backup ${date}`,
      attachments: [{ filename, content: csv, contentType: "text/csv" }]
    });

    // Reset DB stats
    await adminModel.updateOne({}, {
      $set: {
        "retrievals.total": 0,
        "retrievals.trends": {},
        "creations.total": 0,
        "creations.trends": {},
        engagementTrends: {},
        active: {}
      }
    });

    await redis.del("statsCache");

    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ----------------- MAIL ACCESS -----------------
export const access = async (req, res) => {
  try {
    return res.json({ success: await mailAccess() });
  } catch (error) {
    return res.status(500).send();
  }
};
