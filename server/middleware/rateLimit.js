import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 7,
  keyGenerator: (req) => req.body.cryptemail || req.ip, // Prioritize email if available, fallback to IP
  handler: (req, res) => {
    res.status(429).json({ success: false, message: 'Too many login attempts. Try again in few minute.' });
  },
});

export const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => {
    return req.body.userId ? req.body.userId : req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({ success: false, message: 'Too many requests. Try again later.' });
  },
});

export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  handler: (req, res) => {  
      res.status(429).json({ success: false, message: 'Too many requests for public key. Try again later.' });
  },
});
