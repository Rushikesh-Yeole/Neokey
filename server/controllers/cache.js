import redis from "../models/redisClient.js";
import userModel from "../models/userModel.js";
import { symDecrypt, symEncrypt } from "./aesbox.js";
import { hash } from "./magic.js";

export const cacheUserMetadata = async (userId) => {
  let user = await userModel.findById(userId).lean(), meta;
  if (!user) throw new Error("User not found");
  meta = { user: user.user, offset: user.offset, serv: user.serv };

  try {
    await redis.set(`user:${userId}`, symEncrypt(meta, hash(userId)), 'EX', 600);
  } finally {
    for (let k in meta) meta[k] = null;
    for (let k in user) user[k] = null;
    user = meta = null;
  }
};

export const getUserMetadata = async (userId) => {
  let e = await redis.get(`user:${userId}`);
  if (!e) return null;
  try { return symDecrypt(e, hash(userId)); }
  finally { Buffer.isBuffer(e) && e.fill(0); e = null; }
};

export const deleteUserMetadata = async (userId) => {
  try { await redis.del(`user:${userId}`); } catch {}
};

export const cached = async (userId) => {
    const exists = await redis.exists(`user:${userId.toString()}`);
    return exists > 0;
};


export const mailAccess = async (maxLimit = 280) => {
  const key = 'mailCount';
  const count = await redis.get(key);
  if (count > maxLimit) {  return false; }
  return true;
};

export const incMailLimit = async () => {
  const key = 'mailCount';
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 24 * 60 * 60);
  return;
};