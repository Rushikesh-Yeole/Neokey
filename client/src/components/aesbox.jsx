import forge from 'node-forge';
import { argon2id } from '@noble/hashes/argon2';
import { blake3 } from '@noble/hashes/blake3';
import { utf8ToBytes, bytesToHex } from '@noble/hashes/utils';

export const encrypt = (data, publicKeyPem) => {
    if (!publicKeyPem) {
      throw new Error('Public key is undefined');
    }
  
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encrypted = publicKey.encrypt(JSON.stringify(data), 'RSA-OAEP');
    return forge.util.encode64(encrypted);
  };


export const bhash = (data) => bytesToHex(blake3(utf8ToBytes(data)));

export const hash = (password, email=(localStorage.getItem("email") || "")) => {
  const saltbytes = blake3(utf8ToBytes(email));
  const hash = argon2id(
    utf8ToBytes(password),
    saltbytes,
    {
    t: 3,
    m: 14, // 2^14 = 16MB
    p: 1,
    dkLen: 32
  });
  return bytesToHex(hash);
}