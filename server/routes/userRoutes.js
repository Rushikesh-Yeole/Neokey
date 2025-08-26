import express from 'express';
import { create, retrieve, locks } from '../controllers/userController.js';
import userAuth from '../middleware/userAuth.js';
import { getPublicKey } from '../controllers/aesbox.js';
import { generalLimiter, publicLimiter } from '../middleware/rateLimit.js';

const userRouter = express.Router();
userRouter.get('/public-key', publicLimiter, getPublicKey);

// Authenticated routes
userRouter.use(userAuth);
userRouter.use(generalLimiter);

userRouter.post('/create', create);
userRouter.post('/retrieve', retrieve);
userRouter.get('/services', locks);
// userRouter.get('/trial', trial);

export default userRouter;