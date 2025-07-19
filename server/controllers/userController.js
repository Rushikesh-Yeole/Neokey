import userModel from "../models/userModel.js";
import { hash, cook, useOffset, fromHex, adjustOffset, toHex } from './magic.js';
import bcrypt from 'bcryptjs';
import { decrypt} from "./aesbox.js";
import { cached, cacheUserMetadata, getUserMetadata } from "./cache.js";

const updateKey = async (userId, service, tm) => {
    try {
        await userModel.updateOne(
            { _id: userId },
            { $set: { [`serv.${service}`]: tm } }
        );
        return true;
    } catch (error) {
        console.error("Key updation error:", error);
        return false;
    }
};
      
export const create = async(req, res)=> {
    // console.time('CreateOps');
    let address, lock, hashUser;
    try {
        const {userId, cryptpassword, cryptlock, crypttimestamp} = req.body;
        if(!cryptlock || !cryptpassword || !crypttimestamp){
            return res.json({success:false, message: "Incomplete Credentials"});}

        lock = decrypt(cryptlock);
        const timestamp = decrypt(crypttimestamp);

        hashUser = hash(decrypt(cryptpassword))
        address = await userModel.findById(userId, "user").lean();
        if(!address){
            return res.json({success:false, message:`Access Denied. Please Login Again`});
        }
        const chk = await bcrypt.compare(hashUser, address.user);
        if(!chk){
        return res.json({success:false, message:`Access Denied. Check Password`});
        }
        if(chk){
            await updateKey(userId, lock, timestamp);
            try { await cacheUserMetadata(userId); } catch (e) {}
            // console.timeEnd('CreateOps');
            return res.json({success:true, message:`Key Secured for ${lock.replace(/^./, char => char.toUpperCase())}`});
        }
    } catch (error) {   
        return res.json({success:false, message:error.message});
    }finally { [address, hashUser] = [null, null]; }
}

export const retrieve = async(req, res)=> {
    // console.time('retrievalOps');
    let address, key, log, base, hashUser;
    try {
        let {userId, cryptpassword, cryptlock} = req.body;
        if(!cryptpassword || !cryptlock){
            return res.json({success:false, message: "Incomplete Credentials"});}

        let lock = decrypt(cryptlock);

        hashUser = hash(decrypt(cryptpassword))
        if (await cached(userId).catch(() => false)) {
            // console.time('deCache');
            try { address = await getUserMetadata(userId);} catch (e) {}
            // console.timeEnd('deCache');
        } else {
            // console.time('dbRetrieval');
            address = await userModel.findById(userId, { user: 1, offset: 1, [`serv.${lock}`]: 1 }).lean();
            // console.timeEnd('dbRetrieval');
        }        
        
        if(!address){ return res.json({success:false, message:`Access Denied. Please Login Again`}); }
        let chk = await bcrypt.compare(hashUser, address.user);
        if(!chk){ return res.json({success:false, message:`Access Denied. Check Password`}); }
        
        if(chk){
        let tm = address?.serv?.[lock] || null;
        if(!tm){ return res.json({ success: false, message: `No key secured for ${lock}` });};
        
        // console.time('cook');
        log = await bcrypt.hash(hashUser,Number(process.env.BRIMS)/5)
        let flip;
        flip = toHex(adjustOffset(log, address.user, fromHex(decrypt(address.offset))))
        base = useOffset(log, fromHex(flip));
        key = cook(base, lock, tm);
        // console.timeEnd('cook');
        // console.timeEnd('retrievalOps');
        return res.json({ success: true, message: `Tap COPY to grab the ${lock.replace(/^./, char => char.toUpperCase())} key.`, key});
        };
    } catch (error) {
        return res.json({success:false, message:error.message});
    }finally { [address, key, log, base, hashUser] = [null, null, null, null, null]; }
}

export const locks = async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await userModel.findById(userId, { serv: 1 }).lean();
        if (!user || !user.serv) {
            return res.json({ success: false, message: 'User services absent' });
        }
        const servObj = Object.fromEntries(Object.entries(user.serv));
        const locks = Object.keys(servObj);
        return res.json({ success: true, services: locks });
    } catch (error) {
        console.error('Locks retrieval error', error);
        return res.json({ success: false, message: 'Internal server error' });
    }
};