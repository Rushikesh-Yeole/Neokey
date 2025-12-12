/*
* Client-Side Cryptographic Library
* 
* This file contains all client-side hashing and encryption.
* Key ops:
* - arghash: Argon2id password derivation
* - bhash: BLAKE3 hashing for identifiers
* - encrypt: RSA-2048 encryption with server public key
* - symDecrypt: AES-256-GCM decryption
* - hhash: HMAC-SHA256
*/

import { argon2id } from '@noble/hashes/argon2';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha2';
import { utf8ToBytes } from '@noble/hashes/utils';
import forge from 'node-forge';
import { blake3 } from '@noble/hashes/blake3';

export function bhash(data, key) {
  const encoder = new TextEncoder();
  const dataBytes = typeof data === 'string' ? encoder.encode(data) : data;
  const keyBytes = typeof key === 'string' ? encoder.encode(key) : key;
  const derivedKey = sha256(keyBytes);
  const hashArray = blake3(dataBytes, { key: derivedKey });
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Argon2id
export const arghash = async (masterPassword, email) => {
  const salt = sha256(utf8ToBytes(email));
  const hashBytes = argon2id(utf8ToBytes(masterPassword), salt, {
    t: 3, m: 16384, p: 1, dkLen: 32
  });
  return btoa(String.fromCharCode(...hashBytes));
};

// HMAC-SHA256
export const hhash = (msgStr, keyBase64) => {
  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  const result = hmac(sha256, keyBytes, utf8ToBytes(msgStr));
  return btoa(String.fromCharCode(...result));
};

// clientBlob = HMAC("domain:email", masterKey )
export const makeClientBlob = (email, masterKeyBytes) =>
  hhash(`neokey-index-v1:${email}`, masterKeyBytes);

// RSA
export const encrypt = (plaintextStr, publicKeyPem) => {
  const pub = forge.pki.publicKeyFromPem(publicKeyPem);
  const binary = forge.util.encodeUtf8(plaintextStr);
  const encrypted = pub.encrypt(binary, 'RSA-OAEP');
  return forge.util.encode64(encrypted);
};

// --- AES-GCM ---

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

// --- USE ---

export const buildClientBlob = async (masterPassword, email, publicKeyPem) => {
  const masterKeyBase64 = await arghash(masterPassword, email);
  const clientBlobBase64 = makeClientBlob(email, masterKeyBase64);
  return encrypt(clientBlobBase64, publicKeyPem);
};

export const buildSalt = async (masterPassword, email) => {
  const masterKeyBase64 = await arghash(masterPassword, email);
  const clientBlobBase64 = makeClientBlob(email, masterKeyBase64);
  return clientBlobBase64;
};

// --- KEYGEN ---
export const keygen = (skey, csalt) => {
  let key = ""
  let [scope, ...keyhash] = skey.split(':');
  scope = (parseInt(scope, 10)) - 4;
  keyhash = keyhash.join(':');

  const hash = bhash(keyhash, csalt);

  const ascXor = [...hash].reduce((acc, ch) => acc ^ ch.charCodeAt(0), 0);
  let num = [...hash].filter((ch) => /\d/.test(ch));
  let alp = [...hash].filter((ch) => /[a-zA-Z]/.test(ch));
  num = num.length ? num : [...hash].slice(0, 3).map(c => (c.charCodeAt(0) % 10).toString());
  alp = alp.length >= 2 ? alp : [...hash].slice(0, 3).map(c => String.fromCharCode(97 + (c.charCodeAt(0) % 26)));

  const allowedChars = "!#%*+,-./:;<=>?^_`{|}~()[]" + "0123456789" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" ;
  key = allowedChars[(ascXor) % 26];
  key += alp.shift().toUpperCase();
  key += num.shift();
  key += alp.shift().toLowerCase();
  
  let dish = [...hash];
  let ctr = 0;
  
  for (let k = 0; k < scope; k++) {
    ctr = ((ctr << 5) | (ctr >>> 27)) ^ ((dish[k % dish.length].charCodeAt(0) + k * 2654435761) >>> 0);
    key += allowedChars[(ctr >>> 0) % allowedChars.length];
  }

  return key;
};