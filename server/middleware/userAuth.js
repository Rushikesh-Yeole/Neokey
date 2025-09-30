import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { cached, cacheUserMetadata } from "../controllers/cache.js";

export const userAuth = async (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        return res.json({ success: false, message: `'You've logged out`});
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) {
            const userId = decoded.id;
            req.body.userId = userId
            next();
        } else {
            return res.json({ success: false, message: 'Access Denied' });
        }
    } catch (error) {
        return res.json({ success: false, message:error.message});
    }
};

export const grantAccess = async(req,res)=>{
    let {userId} = req.body;
    let user;
    try {
    //Try Redis cache
    if (await cached(userId).catch(() => false)) {
        return res.json({success:true, message:`Cached Access Granted`});
    }
    else{
        let user = await userModel.findById(userId).lean();
        if(user.isAccountVerified==true){
            try { await cacheUserMetadata(userId); } catch (e) {}
            return res.json({success:true, message:`Access Granted`})
        }
    return res.json({ success: false, message: 'Please verify account | Login again' });
    }
    } catch (error) {
        return res.json({ success: false, message:error.message});
    }finally { [userId, user] = [null, null]; }
}

export default userAuth;
