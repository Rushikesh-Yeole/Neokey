import express from 'express';
import { getStats, resetStats, access } from '../controllers/admin.js';
import { generalLimiter } from '../middleware/rateLimit.js';
import { contact } from '../controllers/contact.js';
// import { refactorCreds } from '../controllers/toolkit/refactorDB.js';

const adminRouter = express.Router();
adminRouter.use(generalLimiter);

adminRouter.get('/stats', getStats);
adminRouter.post('/resetstats', resetStats);
adminRouter.post('/contact', contact);
adminRouter.get('/access', access);
// adminRouter.post('/fixCreds', refactorCreds)

export default adminRouter;