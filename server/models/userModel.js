    import mongoose from "mongoose";

    const userSchema = new mongoose.Schema({
        address:{type:String, required: true, unique: true},
        user:{type:String, required: true, unique: true},
        otp:{type:String, default:''},
        otpExpiry:{type:Number, default:0},
        isAccountVerified:{type:Boolean, default:false},
        offset:{type:String, default:""},
        serv: { type: Map, of: String, default: {} }
    })

    const userModel = mongoose.models.user || mongoose.model('user', userSchema);

    export default userModel;