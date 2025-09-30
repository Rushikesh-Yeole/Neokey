import express from 'express';
import {retrieve} from '../controllers/userController.js';
import userAuth from '../middleware/userAuth.js';
import { getStats, created, retrieved, resetStats, engaged, access } from '../controllers/admin.js';
import { getPublicKey } from '../controllers/aesbox.js';
import { generalLimiter } from '../middleware/rateLimit.js';
import { contact } from '../controllers/contact.js';
// import { refactorCreds } from '../controllers/toolkit/refactorDB.js';

const adminRouter = express.Router();

adminRouter.get('/warm', userAuth, async (req, res) => {
    try {
        await retrieve(req, res);
        getPublicKey(req, res);
        res.status(200).send();
    } catch (error) {
        res.status(500).send();
    }
});

adminRouter.head('/warm', userAuth, async (req, res) => {
    try {
        res.status(200).send();
    } catch (error) {
        res.status(500).send();
    }
});

adminRouter.use(generalLimiter);

adminRouter.get('/stats', getStats);
adminRouter.head('/retrieved', retrieved);
adminRouter.head('/created', created);
adminRouter.post('/engage', engaged);
adminRouter.post('/resetstats', resetStats);
// adminRouter.post('/fixCreds', refactorCreds)
adminRouter.post('/contact', contact);
adminRouter.get('/access', access);

export default adminRouter;