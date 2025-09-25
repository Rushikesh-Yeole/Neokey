import { privateDecrypt } from 'crypto';
import forge from 'node-forge';
import crypto from "crypto";

const privateKeyPem = process.env.PRIVATE_KEY;
const publicKeyPem = process.env.PUBLIC_KEY;
const privateKey = Buffer.from(privateKeyPem, 'utf8');
const publicKey = Buffer.from(publicKeyPem, 'utf8');
const b64 = (b) => b.toString("base64");
const fromB64 = (s) => Buffer.from(s, "base64");

export const encrypt = (data) => {
  // Convert the public key PEM string into a forge public key object
  const npublicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const jsonData = JSON.stringify(data);
  // Encrypt the data using RSA-OAEP with SHA-256 hash
  const encrypted = npublicKey.encrypt(jsonData, 'RSA-OAEP');
  return forge.util.encode64(encrypted);
};

export const decrypt = (encryptedData) => {
  const buffer = Buffer.from(encryptedData, 'base64');
  const decrypted = privateDecrypt(privateKey, buffer);
  return JSON.parse(decrypted.toString('utf8'));
};

export const getPublicKey = (req, res) => {
  try {
    res.json({ publicKey: publicKey.toString('utf8') });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve public key" });
  }
};


export const symEncrypt = (data, keyHex=process.env.SALT) => {
  let iv = crypto.randomBytes(12), key = Buffer.from(keyHex, "hex");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let enc = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]);
  const tag = cipher.getAuthTag();
  key.fill(0);
  key = null;
  return `${b64(iv)}.${b64(tag)}.${b64(enc)}`;
};

export const symDecrypt = (str, keyHex=process.env.SALT) => {
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

// export const trial = (req,res)=>{
//   try {
//     let data = `Google`;
//     let ent = encrypt(data);
//     let det = decrypt(ent);
//     console.log(ent);
//     res.json({ data,det });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };