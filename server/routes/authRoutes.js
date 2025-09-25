import express from 'express'
import { gate, bifrost, reset, resetOTP, verifyEmail, closeBifrost } from '../controllers/authController.js';
import {userAuth, grantAccess } from '../middleware/userAuth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const authRouter = express.Router();

authRouter.get('/is-auth', userAuth, grantAccess);

authRouter.use(authLimiter);

authRouter.post('/otp', gate);
authRouter.post('/verify-account', verifyEmail);
authRouter.post('/reset-otp', resetOTP);
authRouter.post('/reset', reset);
authRouter.post('/bifrost',userAuth, bifrost);
authRouter.post('/close-bifrost',closeBifrost );

export default authRouter;