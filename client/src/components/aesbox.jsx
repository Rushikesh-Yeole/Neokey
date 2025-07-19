import forge from 'node-forge';

export const encrypt = (data, publicKeyPem) => {
    if (!publicKeyPem) {
      throw new Error('Public key is undefined');
    }
  
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encrypted = publicKey.encrypt(JSON.stringify(data), 'RSA-OAEP');
    return forge.util.encode64(encrypted);
  };