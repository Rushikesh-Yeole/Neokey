// Neokey Client Crypto Module
// Handles all browser-side hashing, encryption, and the v1 derivation engine.
// Primitives: Argon2id, BLAKE3, RSA-2048-OAEP, AES-256-GCM

// import { argon2id } from '@noble/hashes/argon2';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha2';
import { utf8ToBytes, bytesToHex } from '@noble/hashes/utils';
import forge from 'node-forge';
import { blake3 } from '@noble/hashes/blake3';
import argon2 from 'argon2-browser/dist/argon2-bundled.min.js';

// helpers
const bytesToBase64 = (bytes) => btoa(String.fromCharCode(...bytes));


export const blake = (data) => {
  if (!data) return undefined;
  return bytesToHex(blake3(new TextEncoder().encode(String(data))));
};

export function bhash(data, key) {
  const dataBytes = typeof data === 'string' ? utf8ToBytes(data) : data;
  const keyBytes = typeof key === 'string' ? utf8ToBytes(key) : key;
  const derivedKey = sha256(keyBytes);
  return bytesToHex(blake3(dataBytes, { key: derivedKey }));
}

export const arghash = async (masterPassword, email, config = {}) => {
  const salt = sha256(utf8ToBytes(email));

  const result = await argon2.hash({
    pass: masterPassword,
    salt: salt,
    time: config.t || 3,
    mem: config.m || 19456,
    hashLen: config.dkLen || 32,
    parallelism: config.p || 4,
    type: argon2.ArgonType.Argon2id
  });

  return bytesToBase64(result.hash); 
};

// HMAC-SHA256
export const hhash = (msgStr, keyAnyString) => {
  const keyBytes = utf8ToBytes(keyAnyString);
  const result = hmac(sha256, keyBytes, utf8ToBytes(msgStr));
  return bytesToHex(result);
};

// clientBlob = HMAC(email, masterKey )
export const makeClientBlob = (email, masterKeyBytes) =>
  hhash(email, masterKeyBytes);

// RSA
export const encrypt = (plaintextStr, publicKeyPem) => {
  const pub = forge.pki.publicKeyFromPem(publicKeyPem);
  const binary = forge.util.encodeUtf8(plaintextStr);
  const encrypted = pub.encrypt(binary, 'RSA-OAEP');
  return forge.util.encode64(encrypted);
};

// AES-GCM 

async function strToKey(keyStr){
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(keyStr));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt","decrypt"]);
}

export async function symEncrypt(text,keyStr){
  const key = await strToKey(keyStr), iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(text);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, data));
  return btoa(String.fromCharCode(...[...iv, ...cipher]));
}

export async function symDecrypt(b64,keyStr){
  const key = await strToKey(keyStr), buf = Uint8Array.from(atob(b64), c=>c.charCodeAt(0));
  const iv = buf.slice(0,12), cipher = buf.slice(12);
  const plain = await crypto.subtle.decrypt({name:"AES-GCM", iv}, key, cipher);
  return new TextDecoder().decode(plain);
}

// Bifrost RSA

export const genEphemeralRSA = async () => {
  const kp = await window.crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true, ["encrypt", "decrypt"]
  );
  const pubBuf = await window.crypto.subtle.exportKey("spki", kp.publicKey);
  return { 
    privateKey: kp.privateKey, 
    publicKeyB64: btoa(String.fromCharCode(...new Uint8Array(pubBuf))) 
  };
};

export const ephemeralEncrypt = async (text, pubKeyB64) => {
  const pubKey = await window.crypto.subtle.importKey(
    "spki", Uint8Array.from(atob(pubKeyB64), c => c.charCodeAt(0)), 
    { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]
  );
  const encrypted = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, new TextEncoder().encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

export const ephemeralDecrypt = async (privateKey, encryptedB64) => {
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" }, privateKey, Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0))
  );
  return new TextDecoder().decode(decrypted);
};

export const buildClientBlob = async (masterPassword, email, publicKeyPem, config={}) => {
  const masterKeyBase64 = await arghash(masterPassword, email, config);
  const clientBlobBase64 = makeClientBlob(email, masterKeyBase64);
  return encrypt(clientBlobBase64, publicKeyPem);
};

// Local Hardware Vault (IndexedDB + Web Crypto)
const DB_NAME = "NeokeyVault";
const STORE_NAME = "keys";
const KEY_ID = "local_aes";

const getDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export const initLocalKey = async () => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(KEY_ID);

    // gen non-extractable key
    req.onsuccess = async () => {
      if (req.result) return resolve(req.result);
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
      store.put(key, KEY_ID);
      resolve(key);
    };
    req.onerror = () => reject(req.error);
  });
};

export const localEncrypt = async (text) => {
  const key = await initLocalKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(text);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  return btoa(String.fromCharCode(...[...iv, ...cipher]));
};

export const localDecrypt = async (b64) => {
  try {
    const key = await initLocalKey();
    const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const iv = buf.slice(0, 12), cipher = buf.slice(12);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch (e) { return null; }
};

export const wipeLocalKey = async () => {
  try {
    const db = await getDB();
    db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(KEY_ID);
  } catch(e) {}
};

// KEYGEN
export const keygen = (skey, ckey) => {
  let [version, scope, ...keyhash] = skey.split(':');
  scope = parseInt(scope, 10) || 16;
  keyhash = keyhash.join(':');
  let key = [];

  if (version==='v1') {
  const contextKey = sha256(utf8ToBytes(ckey));

  // Generate Entropy Stream
  // 4x bytes to pick characters AND shuffle them.

  const entropy = blake3(utf8ToBytes(keyhash), { 
    key: contextKey, 
    dkLen: scope * 4 
  });

  const sets = {
    u: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    l: "abcdefghijklmnopqrstuvwxyz",
    n: "0123456789",
    s: "!@#$%^*-_+="
  };
  const all = sets.u + sets.l + sets.n + sets.s;

  let cursor = 0;
  key.push(sets.u[entropy[cursor++] % sets.u.length]);
  key.push(sets.l[entropy[cursor++] % sets.l.length]);
  key.push(sets.n[entropy[cursor++] % sets.n.length]);
  key.push(sets.s[entropy[cursor++] % sets.s.length]);

  const limit = 256 - (256 % all.length);
  while (key.length < scope) {
    const byte = entropy[cursor++];
    if (byte < limit || entropy.length - cursor <= scope) {
      key.push(all[byte % all.length]);
    }
  }	

  // Fisher-yates shuffle
  for (let i = scope - 1; i > 0; i--) {
    const j = entropy[cursor++] % (i + 1);
    [key[i], key[j]] = [key[j], key[i]];
  }
  }

  return key.join('');
};