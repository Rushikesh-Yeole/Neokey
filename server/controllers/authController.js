import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import Bifrost from '../models/bifrostModel.js';
import transporter from '../config/nodemailer.js';
import { OTPMAIL, RESETMAIL } from '../config/emailTemplates.js';
import { hash, adjustOffset, toHex, fromHex, bhash } from './magic.js';
import { decrypt, symDecrypt, symEncrypt} from "./aesbox.js";
import cron from "node-cron";
import { randomInt } from 'crypto';
import { deleteUserMetadata, incMailLimit, mailAccess } from './cache.js';

export const sendOTP = async(cryptemail,hashAddress)=> {
    try {
        const otp = randomInt(0, 1000000).toString().padStart(6, '0');
        const address = await userModel.findOne({ address: hashAddress });
        address.otp = bhash(otp);
        address.otpExpiry = Date.now()+5*60*1000;
        await address.save();

        const mailOption = {
            from : process.env.SENDER_EMAIL,
            to: decrypt(cryptemail), 
            subject: 'NeoKey Access OTP',
            html: OTPMAIL.replace("{{otp}}", otp)
        }
        await transporter.sendMail(mailOption);
        await incMailLimit();
        return {success:true, message: `OTP Sent`};

    } catch (error) {
        console.error("Can't send OTP:", error);
        return {success: false, message: `Can't Gen OTP : ${error.message}`};
    }
}

export const mail = async(cryptemail,S)=> {
    try {
        if (! await mailAccess()){return;}

        const templates = {
            "O": OTPMAIL,
            "R": RESETMAIL,
        };
        const talk = "https://forms.gle/7ittBBRZJ337ZKw57";
        const template = (templates[S] || DEFAULTMAIL).replace("{{contact_link}}", talk)
        
        const mailOption = {
            from : process.env.SENDER_EMAIL,
            to: decrypt(cryptemail), 
            subject: 'NeoKey Access OTP',
            html: template
        }
        await transporter.sendMail(mailOption);
        await incMailLimit();
        return {success:true};

    } catch (error) {
        console.error("Can't send mail:", error);
        return {success: false, message: `Can't send mail : ${error.message}`};
    }
}

export const gate = async (req,res)=>{
    try{
        const {cryptemail, cryptpassword} = req.body;

        if (!cryptemail || !cryptpassword) {
            return res.json({ success: false, message: 'Incomplete Credentials' });}

        const hashAddress= hash(decrypt(cryptemail));
        const hashUser = hash(cryptpassword);

        let address = await userModel.findOne({ address: hashAddress });
        let knull= false;
        let chk = false;
        if (address){
            chk = (hashUser === address.user);
            knull = !address.isAccountVerified}

        if (!address) {
            // const key = await bcrypt.hash(hashUser,Number(process.env.BRIMS))
            address = new userModel({ address:hashAddress, user:hashUser });
            await address.save();
            const otpResponse = await sendOTP(cryptemail, hashAddress);
            return res.json(otpResponse);
        }
        if (knull){
            // address.user = await bcrypt.hash(hashUser,Number(process.env.BRIMS))
            address.user = hashUser;
            await address.save();
            const otpResponse = await sendOTP(cryptemail, hashAddress);
            return res.json(otpResponse);
        }
        if(!knull && !chk){
            return res.json({success:false, message: `Invalid Credentials`});
        }
        if(chk){
            const otpResponse = await sendOTP(cryptemail, hashAddress);
            return res.json(otpResponse);
        }

    }
    catch (error){  
        return res.status(500).json({success:false, message: error.message || `Minor Glitch. Contact Us`})
    }
}

export const verifyEmail = async(req,res)=>{
    const { cryptemail, cryptpassword, cryptotp} = req.body;
    if(!cryptemail || !cryptpassword || !cryptotp){
        return res.json({success:false, message: "Incomplete Credentials"});
    }
    const otp = cryptotp;
    try {
        const hashAddress= hash(decrypt(cryptemail));
        const hashUser = hash(cryptpassword);
        
        const address = await userModel.findOne({address: hashAddress});
        if(!address){return res.json({success:false, message: `Invalid Credentials`});}
        const chk = (hashUser === address.user);

        if(!chk){
            return res.json({success:false, message: `Invalid Credentials`});
        }
        if(address.otp === '' || address.otp!== otp){
            return res.json({success:false, message: `Invalid OTP`});
        }
        if(address.otpExpiry < Date.now()){
            return res.json({success:false, message: `OTP Expired`});
        }

        address.otp='';
        address.otpExpiry=0;
        if(address.offset==""){address.offset = symEncrypt("")}
        address.isAccountVerified=true;
        address.markModified('otp');
        address.markModified('otpExpiry');
        address.markModified('offset');
        await address.save();

        const token=jwt.sign({id: address._id}, process.env.JWT_SECRET, {expiresIn: '45d'});
        return res.json({success:true, message: `Access Granted`, token});

    } catch (error) {
        return res.status(500).json({success:false, message: error.message});
    }
}

export const resetOTP = async(req,res)=>{
    const { cryptemail } = req.body;
    if(!cryptemail){
        return res.json({success:false, message: "Incomplete Credentials"});
    }
    try {
        const hashAddress= hash(decrypt(cryptemail));
        
        const address = await userModel.findOne({address: hashAddress});
        if(!address){return res.json({success:false, message: `Invalid Credentials`});}

        const otpResponse = await sendOTP(cryptemail, hashAddress);
        return res.json(otpResponse);

    } catch (error) {
        return res.status(500).json({success:false, message: error.message});
    }
}

export const reset = async(req,res)=>{
    const {cryptemail, cryptpassword, cryptotp} = req.body;
    if(!cryptemail || !cryptpassword || !cryptotp){
        return res.json({success:false, message: "Incomplete Credentials"});
    }
    
    const otp = cryptotp;
    try {
        const hashAddress= hash(decrypt(cryptemail));
        const hashUser = hash(cryptpassword);
        
        const address = await userModel.findOne({address: hashAddress});
        if(!address){return res.json({success:false, message: `Invalid Credentials`});}

        if(address.otp === '' || address.otp!== otp){
            return res.json({success:false, message: `Invalid OTP`});
        }

        if(address.otpExpiry < Date.now()){
            return res.json({success:false, message: `OTP Expired`});
        }

        address.otp='';
        address.otpExpiry=0;
        address.isAccountVerified=true;
        await mail(cryptemail,"R");
        // const key = await bcrypt.hash(hashUser,Number(process.env.BRIMS));
        const key = hashUser;
        address.offset = symEncrypt(toHex(adjustOffset(key, address.user, fromHex(symDecrypt(address.offset)))));
        address.user = key;
    
        address.markModified('otp');
        address.markModified('otpExpiry');
        address.markModified('user');
        address.markModified('offset');
        await address.save();

        const token=jwt.sign({id: address._id}, process.env.JWT_SECRET, {expiresIn: '60d'});
        try { await deleteUserMetadata(address._id); } catch (e) {console.log(e);}
        return res.json({success:true, message: `Password Reset`, token});

    } catch (error) {
        return res.status(500).json({success:false, message: error.message});
    }
}

export const bifrost = async(req,res) => {
    const {userId, cryptmail} = req.body;
    if(!userId){return res.json({success:false, message: "Incomplete Credentials"});}

    try {
        const gentoken = symEncrypt(jwt.sign({id: userId}, process.env.JWT_SECRET, {expiresIn: '30m'}));
        while(true){
            try {
                const gencode = randomInt(0, 10000).toString().padStart(4, '0');
                await Bifrost.create({ code: gencode , token: gentoken, user: cryptmail, expiresAt: new Date(Date.now() + 1 * 60 * 1000) });
                return res.json({success:true, message: `Bifrost Opened`, code: gencode});
            } catch (error) {
                if (error.code !== 11000) throw error;
            }}
    } catch (error) {
        return res.status(500).json({success:false, message: error.message});
    }
};

export const closeBifrost = async(req,res) => {
    let {code} = req.body;
    if(!code){return res.json({success:false, message: "No codes"});}

    try {
        let bifrost = await Bifrost.findOneAndDelete(
            { code: code },
            { projection: { token: 1, user:1, expiresAt:1, _id: 0 } }
        );

        if (!bifrost || new Date() > new Date(bifrost.expiresAt)){ 
            return res.json({ success: false, message: "Bifrost Unaccessible" });
        }
        let gentoken = symDecrypt(bifrost.token);
        let mail = decrypt(bifrost.user);
        return res.json({success:true, message: `Bifrost entered`, token: gentoken, mail});
    } catch (error) {
        return res.status(500).json({success:false, message: error.message});
    }
};

export const bifrostCleanup = async () => {
    try {
        const currentDate = new Date();
        
        const result = await Bifrost.deleteMany({
            expiresAt: { $lt: currentDate }
        });

        console.log(`Cleanup completed. Closed ${result.deletedCount} Bifrosts.`);
    } catch (error) {
        console.error('Cleanup error:', error);
    }
};

cron.schedule("0 */3 * * *", () => bifrostCleanup().catch(err => console.error('Bifrost cleanup failed:', err)));