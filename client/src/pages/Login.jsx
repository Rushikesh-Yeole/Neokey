import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from 'axios';
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { encrypt } from "../components/aesbox";
import Footer from "../components/Footer";

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, isLoggedIn, setIsLoggedIn, publicKey } = useContext(AppContext);
  const inputRefs = React.useRef([]);

  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn=='T') { navigate('/');}
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setEmail(storedEmail)};
  }, [isLoggedIn]);
  

  useEffect(() => {
    if (isSent && otp.every((digit) => digit !== '')) {
      verifyOtp();
    }
  }, [otp, isSent]);
  
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
        if (!email || !password) {
          toast.error("Please provide both email and password.");
          return;
        }
        setIsLoading(true)
        const cryptemail = encrypt(email, publicKey);
        const cryptpassword = encrypt(password, publicKey);
        const { data } = await axios.post(backendUrl + '/auth/otp', { cryptemail, cryptpassword });
        if (data.success) {
          document.activeElement.blur();
          setIsLoading(false)
          setIsSent(true);
          setTimeout(()=>setIsSent(false), (60 * 1000 * 5));
          toast.success(data.message,{ autoClose: 1200});
        } else {
          // document.getElementById("neokey").focus();
          toast.error(data.message,{ autoClose: 1200});
          setIsLoading(false)
        }
      } catch (error) {
      setIsLoading(false)
      toast.error(error.message,{ autoClose: 1500});
    }
  };

  const verifyOtp = async () => {
    if(isSent){try {
      const otpString = otp.join('');
      const cryptemail = encrypt(email, publicKey);
      const cryptpassword = encrypt(password, publicKey);
      const cryptotp = encrypt(otpString, publicKey);
      
      const { data } = await axios.post(backendUrl + '/auth/verify-account', { cryptemail, cryptpassword, cryptotp });
      if (data.success) {
        localStorage.setItem("email", email);
        localStorage.setItem("token", data.token);
        setIsLoggedIn('T');
        setPassword("");
        setOtp(['', '', '', '', '', ''])
        await axios.post(`${backendUrl}/admin/engage`, { action:`login`});
        toast.success(data.message, {autoClose: 400,
          onClose: () => {
          setIsLoggedIn('T');
          setPassword("");
          setOtp(['', '', '', '', '', ''])
          navigate('/');
          window.location.reload();}
        });
      } else {
        setOtp(['', '', '', '', '', ''])
        toast.error(data.message,{ autoClose: 1200});
      }
    } catch (error) {
      toast.error(error.message,{ autoClose: 1500});
    }}
  };

  const handleInput = (e, index) => {
    const value = e.target.value;

    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

    if (index === 5 && value) {
      e.target.blur(); // Remove focus from the last input field
      window.scrollTo(0, 0);} // Scroll to the top of the page
      
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
    <div className='autocomplete="off" flex flex-col items-center justify-center min-h-screen pt-16 sm:pt-24 sm:pb-0 px-6 sm:px-6 bg-gradient-to-br from-gray-900 to-cyan-900 select-none animate-pulse-smooth'>
    <Navbar />
    <div className="glass-card shadow-glass mt-40 sm:mt-24 p-6 sm:p-10 rounded-lg shadow-xl w-full max-w-sm sm:max-w-md text-white text-sm">
      <h2 className="text-3xl font-bold text-center mb-3">Login / SignUp</h2>
      <form onSubmit={e => (e.preventDefault(), setOtp(['', '', '', '', '', '']), onSubmitHandler(e))} className="space-y-4">
      <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-white bg-slate-900">
        <img src={assets.mail_icon} alt="" />
        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          className="bg-transparent outline-none w-full"
          type="email"
          placeholder="Email ID"
          autoComplete="username"
          required
          style={{ overflowX: 'scroll', whiteSpace: 'nowrap' }}
        />
      </div>

      <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-white bg-slate-900">
        <img src={assets.lock_icon} alt="" />
        <input
          id="neokey"
          onChange={(e) => setPassword(e.target.value.trim().toLowerCase())}
          value={password}
          className="bg-transparent outline-none w-full"
          type="new-password"
          style={{ WebkitTextSecurity: "disc" }}
          placeholder="Password"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          required
          />
        </div>

        {isSent && (
          <div
          className="flex flex-nowrap justify-center gap-1 sm:flex-nowrap"onPaste={handlePaste}>
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

    <div className="flex justify-center gap-4 cursor-pointer text-center">
    <p onClick={() => navigate("/bifrost")}>Bifrost</p>
    <p onClick={() => navigate("/reset")}>|</p>
    <p onClick={() => navigate("/reset")}>Reset Password</p>
    </div>

    { <button type="submit" className={`font-size: 16px w-full py-2.5 rounded-full border border-[#00f9ff] shadow-sm text-white font-medium ${isLoading? "loading-bar":"" } `}>{isSent? "Re-send OTP":"Send OTP" }</button>}
      </form>
      </div>
      <div className="w-full mt-auto ">
      <Footer />
      </div>
    </div>
    )};

export default Login;