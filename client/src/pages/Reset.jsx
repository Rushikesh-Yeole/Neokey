import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from 'axios';
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { encrypt, arghash, symEncrypt } from "../components/aesbox";
import Footer from "../components/Footer";

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, isLoggedIn, setIsLoggedIn, publicKey, demo, symKey } = useContext(AppContext);
  const inputRefs = React.useRef([]);
  const otpCallRef = React.useRef(false);

  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [ppassword, setPassword] = useState('');
  const [password, setFPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  useEffect(() => {
  const getmail = async ()=>{
    const storedEmail = await symDecrypt(localStorage.getItem("email"),symKey);
    if (storedEmail) {
    setEmail(storedEmail)};
  }
    getmail();
  }, [symKey]);
  

  useEffect(() => {
    if (isSent && otp.every((digit) => digit !== '')) {
    if (otpCallRef.current) return;
    otpCallRef.current = true;
    verifyOtp();
    setTimeout(() => { otpCallRef.current = false; }, 500);
  }
  }, [otp, isSent]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      if(demo){ toast.info("Can't reset Demo account password. Please Sign in",{ autoClose: 2000}); return}
      if (!email) {
        toast.error("Please provide email.");
        return;}
      if(!password || password!==ppassword){
        toast.error("Passwords don't match.");
        return;}
        
        setIsLoading(true)
        const cryptemail = encrypt(email, publicKey);
        const { data } = await axios.post(backendUrl + '/auth/reset-otp', {cryptemail});
      if (data.success ) {
        document.activeElement.blur();
        setIsLoading(false)
        setIsSent(true);
        localStorage.setItem("csalt", encrypt(arghash(data.CsToken + email), publicKey));
        toast.success(data.message,{ autoClose: 1000});
      } else {
        setIsLoading(false)
        toast.error(data.message,{ autoClose: 1000});
      }
    } catch (error) {
      setIsLoading(false)
      toast.error(error.message);
    }
  };

  const verifyOtp = async () => {
    try {
      const otpString = otp.join('');
      if(!password || password!==ppassword){
        toast.error("Passwords don't match.");
        return;
      }
      let cryptemail = encrypt(email, publicKey);
      let cryptpassword = arghash(password, email);
      const cryptotp = (otpString);
      let cryptsalt = localStorage.getItem("csalt");
      const { data } = await axios.post(backendUrl + '/auth/reset', { cryptemail, cryptpassword, cryptotp, cryptsalt });
      if (data.success) {
        document.activeElement.blur();
        localStorage.setItem("email", await aesEncrypt(email,symKey));
        localStorage.setItem("token", data.token);
        axios.defaults.headers["Authorization"] = `Bearer ${data.token}`;
        
        toast.success(data.message, {autoClose: 500,
          onClose: () => {
          setIsLoggedIn('T');
          setPassword("");
          setOtp(['', '', '', '', '', ''])
          navigate('/');
          }
        });
      } else {
        toast.error(data.message,{ autoClose: 1000});
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleInput = (e, index) => {
    const value = e.target.value;

    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

    if (index === 5 && value) {
      e.target.blur();
      window.scrollTo(0, 0);}
  
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = paste.split('');
    newOtp.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });
    setOtp(newOtp);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-16 sm:pt-24 px-6 sm:px-6 bg-gradient-to-br from-gray-900 to-cyan-900 select-none animate-pulse-smooth">
    <Navbar />
    <div className="glass-card shadow-glass mb-auto mt-20 p-6 sm:p-10 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md text-white text-sm">
      <h2 className="text-3xl font-bold text-center mb-3">Reset Neokey</h2>

      <form onSubmit={e => (e.preventDefault(), onSubmitHandler(e))} className="space-y-4">
      <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-white bg-slate-900">
        <img src={assets.mail_icon} alt="" />
        <input
          onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
          value={email}
          className="bg-transparent outline-none w-full"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          style={{ overflowX: 'scroll', whiteSpace: 'nowrap' }}
        />
      </div>

      <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-white bg-slate-900">

        <img src={assets.lock_icon} alt="" />
        <input
          onChange={(e) => setPassword(e.target.value.trim().toLowerCase())}
          value={ppassword}
          className="bg-transparent outline-none w-full"
          type="new-password"
          style={{ WebkitTextSecurity: "disc" }}
          placeholder="New Password"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </div>

      <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-white bg-slate-900">

        <img src={assets.lock_icon} alt="" />
        <input
          id="neokey"
          onChange={(e) => setFPassword(e.target.value.trim().toLowerCase())}
          value={password}
          className="bg-transparent outline-none w-full"
          type="new-password"
          style={{ WebkitTextSecurity: "disc" }}
          placeholder="Confirm Password"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </div>

      {isSent && (
        <div className="flex flex-nowrap justify-center gap-1 sm:flex-nowrap"onPaste={handlePaste}>
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <input
              type="tel"
              maxLength="1"
              key={index}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 text-center text-xl rounded-md"
              ref={(e) => (inputRefs.current[index] = e)}
              value={otp[index]}
              onInput={(e) => handleInput(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}/>
        ))}
      </div>
      )}

    { <button type="submit" className={`font-size: 16px w-full py-2.5 rounded-full border border-[#00f9ff] shadow-sm text-white font-medium ${isLoading? "loading-bar":"" } `}>{isSent? "Re-send OTP":"Send OTP" }</button>}
      </form>
      </div>
      <div className="w-full mt-auto text-slate-400">
      <Footer />
      </div>
    </div>
    )};

export default Login;