import userModel from "../models/userModel.js";
import { hash, cook, useOffset, fromHex } from './magic.js';
// import bcrypt from 'bcryptjs';
import { decrypt, symDecrypt} from "./aesbox.js";
import { cached, cacheUserMetadata, getUserMetadata } from "./cache.js";

const updateKey = async (uid, svc, tm, idx) =>
  userModel.updateOne(
    { _id: uid, "serv.name": svc },
    { $set: { "serv.$.tm": tm } }
  ).then(r =>
    r.matchedCount ? true :
    userModel.updateOne(
      { _id: uid },
      { $push: { serv: { name: svc, idx: idx, tm } } }
    ).then(()=>true)
  ).catch(e => (console.error("updateKey:", e), false));

      
export const create = async(req, res)=> {
    // console.time('CreateOps');
    let address, lock, hashUser;
    try {
        const {userId, cryptpassword, cryptlock, timestamp} = req.body;
        if(!cryptlock || !cryptpassword || !timestamp){
            return res.json({success:false, message: "Incomplete Credentials"});}

        lock = decrypt(cryptlock);
        hashUser = hash(cryptpassword);
        address = await userModel.findById(userId, "user").lean();
        if(!address){
            return res.json({success:false, message:`Can't Authenticate. Please Login Again`});
        }
        const chk = (hashUser === address.user);
        if(!chk){
        return res.json({success:false, message:`Access Denied. Check Credentials`});
        }
        if(chk){
            await updateKey(userId, lock, timestamp, hash(userId+lock));
            void cacheUserMetadata(userId).catch((e) => {console.error("Metadata caching failed:", e);});
            // console.timeEnd('CreateOps');
            return res.json({success:true, message:`Key Secured for ${lock.replace(/^./, char => char.toUpperCase())}`});
        }
    } catch (error) {   
        return res.json({success:false, message:error.message});
    }finally { [address, hashUser] = [null, null]; }
}

export const retrieve = async(req, res)=> {
    let address, key, tm, base, hashUser;
    // console.time('retrievalOps');
    try {
        let {userId, cryptpassword, cryptlock, cryptsalt} = req.body;
        
        if(!cryptpassword || !cryptlock || !cryptsalt){
            return res.json({success:false, message: "Incomplete Credentials"});}
        let lock = decrypt(cryptlock);
        // console.time('cook');
        hashUser = hash(cryptpassword);
        if (await cached(userId).catch(() => false)) {
            // console.log('cache')
            try { address = await getUserMetadata(userId);} catch (e) {}
        } else {
            // console.log('db')
            address = await userModel.findById(userId, { user: 1, offset: 1, serv: 1 }).lean();
        }        
        // address setting took 70ms
        // console.timeEnd('cook');
        
        if(!address){ return res.json({success:false, message:`Access Denied. Please Login Again`}); }
        // console.time('modulartest')
        let chk = (hashUser === address.user);
        // console.timeEnd('modulartest')
        if(!chk){ return res.json({success:false, message:`Access Denied. Check Credentials`}); }
        // chk took 160ms
        
        if(chk){
        let tmDoc = address.serv?.find(s => s.name === lock) || null;
        if(!tmDoc?.tm){ return res.json({ success: false, message: `No key secured for ${lock}` });}
        let tm=tmDoc.tm;
        let scope=Number(tm.slice(0,2));
        tm=tm.slice(2);
        
        base = useOffset(hashUser, fromHex(symDecrypt(address.offset)));
        key = cook(base, lock, tm, decrypt(cryptsalt));
        key=key.slice(0,scope);
        return res.json({ success: true, message: `Tap COPY to grab the ${lock.replace(/^./, char => char.toUpperCase())} key.`, key});
        };
    } catch (error) {
        return res.json({success:false, message:error.message});
    }finally { 
        // console.timeEnd('retrievalOps');
        [address, key, tm, base, hashUser] = [null, null, null, null, null]; 
        // console.timeEnd('cook'); 
    }
}

export const locks = async (req, res) => {
    const { userId } = req.body;
    let address;
    try {
        if (await cached(userId).catch(() => false)) {
            address = await getUserMetadata(userId);
        } else {
            address = await userModel.findById(userId, 'alias serv.name').lean();
        }        
        if (!address || !address.serv) {
            return res.json({ success: false, message: 'User services absent' });
        }
        const alias = address.alias;
        const locks = address.serv.map(s => s.name) || [];
        return res.json({ success: true, services: locks, alias:alias });
    } catch (error) {
        console.error('Services retrieval error', error);
        return res.json({ success: false, message: 'Internal server error for fetching services' });
    }
};

export const delLock = async (req, res) => {
  const { userId, cryptpassword, services } = req.body;
  if (!userId || !cryptpassword || !Array.isArray(services)) 
    return res.json({ success: false, message:"Service/Credentials Absent" });

  try {
    let address;
    if (await cached(userId).catch(() => false)) {
        try { address = await getUserMetadata(userId);} catch (e) {}
    } else {
        address = await userModel.findById(userId, { user: 1 }).lean();
    }        
    let chk = (hash(cryptpassword) === address.user);
    if(!chk){ return res.json({success:false, message:`Change Denied. Check Credentials`}); }
            
    await userModel.updateOne(
      { _id: userId },
      { $pull: { serv: { name: { $in: services } } } }
    );

    await cacheUserMetadata(userId).catch((e) => {console.error("Metadata caching failed:", e);});
    address = await userModel.findById(userId, 'serv.name').lean();
    const locks = address?.serv?.map(s => s.name) || [];
    
    return res.json({ success: true, message: "Changes saved", services:locks });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};