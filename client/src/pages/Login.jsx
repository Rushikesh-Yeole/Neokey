import React, { useContext, useState, useEffect, useRef } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from 'axios';
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { encrypt, symDecrypt, buildClientBlob, bhash, hhash, arghash, symEncrypt, localEncrypt } from "../components/aesbox";
import Footer from "../components/Footer";
import { RecoveryArtifact } from "../components/recover";
import CredStore from "../components/CredStore";
import posthog from 'posthog-js';

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, isLoggedIn, setIsLoggedIn, publicKey, authAccess, signup, setSignup, recoveryPdf, setRecoveryPdf } = useContext(AppContext);
  const inputRefs = useRef([]);

  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState(signup ? "signup" : "login");
  const [authsalt, setAuthsalt] = useState('');
  const [csalt, setCsalt] = useState('');
  const [stub, setStub] = useState('');

  useEffect(() => {
    if (isLoggedIn === 'T') { navigate('/'); }
  }, [isLoggedIn, signup, navigate]);

  const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    );
  };
  
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsSent(false);
    try {
      if (!email || !validateEmail(email)) {
        toast.error("Please provide valid email.");
        return;
      }

      setIsLoading(true);
      await new Promise(r => setTimeout(r, 1200));

      const cryptemail = encrypt(email, publicKey);
      const cryptcred = await buildClientBlob(email, email, publicKey, { t: 3, m: 65536 });

      const newStub = crypto.getRandomValues(new Uint8Array(32)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
      setStub(newStub);
      const cryptStub = encrypt(newStub, publicKey);

      const { data } = await axios.post(backendUrl + '/auth/otp', { cryptemail, cryptcred, stub: cryptStub });

      if (data.success) {
        document.activeElement.blur();
        setAuthsalt(data.authsalt);
        setTimeout(() => setAuthsalt(''), (60 * 1000 * 5));
        setCsalt(data.csalt);
        setIsLoading(false);
        setIsSent(true);
        setTimeout(() => setIsSent(false), (60 * 1000 * 5));
        toast.success(data.message, { autoClose: 1500 });
      } else {
        toast.error(data.message, { autoClose: 1500 });
        setIsLoading(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Request failed";
      toast.error(errorMessage, { autoClose: 1500 });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!isSent) return;

    setIsLoading(true);
    if (!email || !password || !otp) {
      toast.error("Incomplete request.");
      setOtp(['', '', '', '', '', '']);
      return;
    }

    try {
      const otpString = otp.join('');
      const rstub = crypto.getRandomValues(new Uint8Array(32)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

      const useAuthsalt = await symDecrypt(authsalt, bhash(stub, otpString)).catch(() => rstub);
      const csaltv = await symDecrypt(csalt, bhash(stub, otpString)).catch(() => rstub);

      const cred = await arghash(password, csaltv);
      const snkeyV = hhash("snkey", cred);
      const cred_hash = hhash("cred", cred);

      CredStore.setCsalt(csaltv);
      CredStore.setSnkey(snkeyV);
      CredStore.setCred(cred);

      const cryptcred = encrypt(cred_hash, publicKey);
      const cotp = bhash(otpString, useAuthsalt);
      const cryptotp = encrypt(cotp, publicKey);
      const cryptaction = encrypt(useAuthsalt.length.toString().padStart(2, '0') + useAuthsalt + action, publicKey);

      const { data } = await axios.post(backendUrl + '/auth/verify-account', { cryptcred, cryptotp, cryptaction });

      if (data && data.success) {
        setAuthsalt('');
        setStub('');
        setCsalt('');

        localStorage.setItem("csalt", await symEncrypt(csaltv, data.saltKey));

        const token = await symDecrypt(data.token, cotp);
        const encToken = await localEncrypt(token);
        localStorage.setItem("token", encToken);
        axios.defaults.headers["Authorization"] = `Bearer ${token}`;

        if (action === "signup" && data.newAcc) {
          setSignup(false);
          setRecoveryPdf(true);
          posthog.capture('signup_completed');
        }

        toast.success(data.message, { autoClose: 500 });

        if (!data.newAcc) {
          setPassword("");
          setOtp(['', '', '', '', '', '']);
          posthog.capture('login_completed');
          setIsLoggedIn('T');
        }
      } else {
        setOtp(['', '', '', '', '', '']);
        CredStore.wipe();
        toast.error(data.message || "Verification Failed. Contact us", { autoClose: 1500 });
      }
    } catch (error) {
      setOtp(['', '', '', '', '', '']);
      CredStore.wipe();
      const errorMessage = error.response?.data?.message || "Verification Failed. Contact us";
      toast.error(errorMessage, { autoClose: 1500 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = (e, index) => {
    const value = e.target.value;

    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (index === 5 && value && password) {
        e.target.blur();
        window.scrollTo(0, 0);
      }

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
    <div className="flex flex-col items-center justify-center min-h-screen pt-16 sm:pt-24 sm:pb-0 px-6 sm:px-6 bg-gradient-to-br from-gray-900 to-cyan-900 select-none animate-pulse-smooth">
      <Navbar />

      {recoveryPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-500"></div>

          <div className="relative glass-card p-6 rounded-3xl shadow-2xl w-full max-w-sm mx-6 border border-white/10 animate-pulse-smooth">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-cyan-500/10 rounded-full mb-4">
                <img src={assets.lock_icon} className="w-8 h-8 opacity-80" alt="" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Account Created</h2>
              <p className="text-white text-xs sm:text-base font-semibold mb-6 text-center">
                Save your
                <span className="text-cyan-400 font-mono"> one-time Recovery Artifact (PDF) </span>
                encrypted on-device.<br />
                <span className="text-cyan-400 font-mono">Your <b>email</b> is the password</span><br />
                Keep it secure.
              </p>

              <button
                type="button"
                onClick={async () => {
                  const pdfResult = await RecoveryArtifact(password, email);
                  if (pdfResult.success) toast.success("Downloading Recovery PDF...");

                  setTimeout(() => {
                    setEmail("");
                    setPassword("");
                    setOtp(['', '', '', '', '', '']);
                    setIsLoggedIn('T');
                    navigate('/');
                  }, 500);
                }}
                className="w-full bg-slate-100 hover:bg-white text-slate-950 font-medium py-3 rounded-full transition-all duration-300 shadow-sm active:scale-[0.98]"
              >
                Download & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {!authAccess && !isSent ? (
        <div className="fixed inset-0 glass-card flex items-center justify-center z-50">
          <div className="text-white p-6 rounded-lg shadow-xl max-w-xs sm:max-w-sm w-full text-center glass-card">
            <h3 className="text-2xl font-bold mb-3">High Traffic</h3>
            <p className="text-gray-300 mb-6">
              Logins and signups are temporarily unavailable due to high user onboarding. <br /> You can access the system again in 24 hours.
            </p>
            <button
              onClick={() => { navigate('/'); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300); }}
              className="px-6 py-2 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold transition"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="ml-6 px-6 py-2 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold transition"
            >
              Contact
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card shadow-glass mt-40 sm:mt-16 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-sm sm:max-w-md text-white text-sm">
          <h2 className="text-3xl font-bold text-center mb-3">{isSent? "Enter OTP" : (action === "signup" ? "Sign Up" : "Login")}</h2>
          <form onSubmit={(e) => { e.preventDefault(); isSent ? verifyOtp() : (() => { setOtp(['', '', '', '', '', '']); onSubmitHandler(e); })(); }} className="space-y-4">
            <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-white bg-slate-900">
              <img src={assets.mail_icon} alt="" />
              <input
                onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                value={email}
                className="bg-transparent outline-none w-full"
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                disabled={isSent}
                required
                style={{ overflowX: 'scroll', whiteSpace: 'nowrap' }}
              />
            </div>

            <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-white bg-slate-900">
              <img src={assets.lock_icon} alt="" />
              <input
                id="neokey"
                onChange={(e) => setPassword(e.target.value.trim())}
                value={password}
                className="bg-transparent outline-none w-full"
                type="new-password"
                placeholder={action == 'login' ? "Enter you master password" : "Set a strong master password"}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                disabled={isSent}
                required
              />
            </div>

            {isSent && (
              <div className="flex flex-nowrap justify-center gap-1 sm:flex-nowrap" onPaste={handlePaste}>
                {Array(6).fill(0).map((_, index) => (
                  <input
                    type="tel"
                    maxLength="1"
                    key={index}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 text-center text-xl rounded-md"
                    ref={(e) => (inputRefs.current[index] = e)}
                    value={otp[index]}
                    onInput={(e) => handleInput(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-center gap-4 cursor-pointer text-center">
              <p onClick={() => navigate("/bifrost")}>Bifrost</p>
              <p onClick={() => navigate("/reset")}>|</p>
              <p onClick={() => { setAction(a => a === "signup" ? "login" : "signup"); setIsSent(false); }}>{action === "signup" ? "Login" : "Sign Up"}</p>
            </div>

            <button
              disabled={isLoading || (isSent && otp.includes(''))}
              type="submit"
              className={`text-base w-full py-2.5 rounded-full border border-[#00f9ff] shadow-sm text-white font-medium transition-all disabled:opacity-50 ${isLoading ? "loading-bar" : ""}`}
            >
              {isLoading ? "Processing..." : (isSent ? "Verify OTP" : "Send OTP")}
            </button>

            {isSent && (
              <p
                type="button"
                onClick={(e) => { e.preventDefault(); setOtp(['', '', '', '', '', '']); onSubmitHandler(e); }}
                className="w-full text-sm text-cyan-400 hover:text-cyan-200 transition-colors bg-transparent text-center cursor-pointer"
              >
                Didn't receive code? Re-send
              </p>
            )}
          </form>
        </div>
      )}
      <div className="w-full mt-auto text-gray-200">
        <Footer />
      </div>
    </div>
  );
};

export default Login;