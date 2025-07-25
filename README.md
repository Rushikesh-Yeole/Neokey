# 🚀 Neokey  
*Stateless HMAC‑Powered Password Generation*  
**🔐 Unbreakable 16‑Character Keys On‑Demand | 🛡 Zero Storage · Zero Breaches · Pure Privacy**  

---

## ✨ The Vision
Where conventional vaults crumble, **Neokey** forges an impervious authentication layer: a MERN‑stack symphony (React, Node.js, Express, MongoDB Atlas, Redis) orchestrated with SHA‑256 HMAC, RSA‑OAEP & AES‑256‑GCM to generate fortress‑grade credentials—never at rest.

## 🌟 Core Features

**🕵️ Phantom Passwords**  
• Stateless HMAC-SHA256 derivation yields 92+ bit entropy, 16-char keys—no plaintext vault, no database of secrets.  
• Deterministic runtime inputs + master algorithm ensure zero false positives on unauthorized regeneration.

**🗄️ Zero‑Trace Architecture**  
• Only opaque HMAC metadata in MongoDB Atlas (encrypted) and transient AES‑256‑GCM in Redis (10 min TTL).  
• Complete anonymity: Neokey collects zero personally identifiable information (PII), and the system doesn't keep logs that could trace back to individual users or their actions.

**⚙️ Dynamic Key Versatility**  
• Generate infinite unique passwords per service—ideal for rotation policies.  
• Master Key rotation retains retroactive access without compromising past keys.

**🔒 Fortified End‑to‑End Security**  
• Browser-side RSA‑OAEP encryption (node-forge) for inbound secrets.  
• AES‑256‑GCM seals API responses; nodemailer + Brevo SMTP powers resilient OTP-based 2FA.

**🛡️ Reinforced Access Control**  
• Every generation call demands the NeoKey—even mid-session—eliminating token reuse.  
• Express-rate-limit, CORS, cookie-parser, JSON Web Tokens & intrusion guards provide multi-layered defense.

**📈 Performance & Reliability**  
• ioredis caching accelerates metadata retrieval.  
• Node-cron jobs manage cleanup; dotenv-driven configs streamline deployments on Render.

---

*Witness at* [Neokey](https://neokey.onrender.com)  
**Your passwords were never here**

`A Rushikesh Yeole Production`