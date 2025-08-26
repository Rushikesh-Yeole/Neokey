import redis from "../models/redisClient.js";
import userModel from "../models/userModel.js";
import crypto from "crypto";
import { hash } from "./magic.js";

const b64 = (b) => b.toString("base64");
const fromB64 = (s) => Buffer.from(s, "base64");

const encrypt = (data, keyHex) => {
  let iv = crypto.randomBytes(12), key = Buffer.from(keyHex, "hex");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let enc = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]);
  const tag = cipher.getAuthTag();
  key.fill(0);
  key = null;
  return `${b64(iv)}.${b64(tag)}.${b64(enc)}`;
};

const decrypt = (str, keyHex) => {
  let [iv, tag, enc] = str.split(".").map(fromB64), dec;
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(keyHex, "hex"), iv);
    decipher.setAuthTag(tag);
    dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return JSON.parse(dec.toString());
  } finally {
    if (dec) dec.fill(0);
    dec = enc = iv = tag = null;
  }
};

export const cacheUserMetadata = async (userId) => {
  let user = await userModel.findById(userId).lean(), meta;
  if (!user) throw new Error("User not found");
  meta = { user: user.user, offset: user.offset, serv: user.serv };

  try {
    await redis.set(`user:${userId}`, encrypt(meta, hash(userId)), 'EX', 600);
  } finally {
    for (let k in meta) meta[k] = null;
    for (let k in user) user[k] = null;
    user = meta = null;
  }
};

export const getUserMetadata = async (userId) => {
  let e = await redis.get(`user:${userId}`);
  if (!e) return null;
  try { return decrypt(e, hash(userId)); }
  finally { Buffer.isBuffer(e) && e.fill(0); e = null; }
};

export const deleteUserMetadata = async (userId) => {
  try { await redis.del(`user:${userId}`); } catch {}
};

export const cached = async (userId) => await redis.exists(`user:${userId}`) === 1;