import { privateDecrypt } from 'crypto';
import forge from 'node-forge';

const privateKeyPem = process.env.PRIVATE_KEY;
const publicKeyPem = process.env.PUBLIC_KEY;
const privateKey = Buffer.from(privateKeyPem, 'utf8');
const publicKey = Buffer.from(publicKeyPem, 'utf8');

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