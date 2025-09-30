import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '../bifrost.css';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import Navbar from "../components/Navbar";
import debounce from 'lodash.debounce';
import Footer from '../components/Footer';
import { useCallback } from 'react';
import { encrypt } from '../components/aesbox';

const timeWindow = 62;


const BifrostPage = () => {
  const { publicKey, backendUrl, isLoggedIn, setIsLoggedIn } = useContext(AppContext);
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeWindow);
  const [code, setCode] = useState("");
  const [receiverOpened, setReceiverOpened] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [blinkClass, setBlinkClass] = useState("");

  useEffect(() => {
    if (isLoggedIn==='T' && started) {
      const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      const timeout = setTimeout( ()=> closePortal(), (timeWindow * 1000)+1000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }
  }, [started, isLoggedIn]);

  const closePortal = useCallback(async ()=>{
    setStarted(false);
    setTimeLeft(timeWindow);
    setEnteredCode("");setCode("");
    heimdall('close-bifrost');
  })

  useEffect(() => {
    if (isLoggedIn==='F' && receiverOpened && enteredCode.trim().length === 4){
      document.activeElement.blur();
      setCode(enteredCode);
      heimdall('close-bifrost')};
  }, [enteredCode, isLoggedIn, receiverOpened]);

  const heimdall = debounce(async (action) =>{
    try {
      let start = performance.now();
      let cryptmail= encrypt(localStorage.getItem("email"),publicKey);
      let { data } = await axios.post(`${backendUrl}/auth/${action}`,{code: enteredCode || code, cryptmail});
      console.log('heimdall');
      if(data.success){
        if(action == 'bifrost'){
          toast.success(data.message,{ autoClose: 1000});
          setStarted(true); setTimeLeft(timeWindow); setCode(data.code);}
        if(isLoggedIn!=='T'){
          setEnteredCode("");setCode("");
          setBlinkClass("blink-success");
          localStorage.setItem("token", data.token);
          localStorage.setItem("email", data.mail);
          axios.defaults.headers["Authorization"] = `Bearer ${data.token}`;

          setTimeout(() => {setIsLoggedIn('T'); navigate('/');}, 3000);
        }
      }else{setBlinkClass("blink-error"); setTimeout(() => { setBlinkClass(""); setEnteredCode("");setCode(""); }, 1000);}
      let end = performance.now();
      let timeTaken = end - start;
      console.log(`${action} time : ${timeTaken.toFixed(2)} ms`);
      if(action == 'bifrost'){axios.post(`${backendUrl}/admin/engage`, { action:"bifrost"}).catch(() => {});}
    } catch (error) {
      closePortal();
      toast.error(error.message,{ autoClose: 1000});
    }
  }, 1500);

  const circumference = 283;
  const dashOffset = (circumference * timeLeft) / timeWindow;

  if (isLoggedIn==='T') {
    return (
      <div className="flex flex-col items-center pt-40 mb-auto justify-center min-h-screen bg-gradient-to-b from-gray-900 to-cyan-900 select-none p-4">
        {<Navbar/>}
        {!started ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center mb-4">
              <p className="text-white text-2xl font-mono">Initiate BIFROST protocol.</p>
              <p className="text-white text-sm font-mono opacity-80">
                This opens a code secured channel for Rapid login with Global access.<br/>Once activated, you've got 60 seconds, tops.
              </p>
            </div>
            <button onClick={()=>{heimdall('bifrost');setStarted(true);}} className="relative flex items-center justify-center w-48 h-48 rounded-full bg-black bg-opacity-50 backdrop-blur-md border border-cyan-400 shadow-2xl hover:shadow-neon transition-all duration-500">
              <span className="absolute inset-0 rounded-full animate-shimmer"></span>
              <span className="relative text-xl font-semibold text-cyan-200 drop-shadow-lg">Open Bifrost</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center text-cyan-100 font-mono text-lg drop-shadow-sm">Bifrost active. But not for long.<br></br>Enter this key to enter portal elsewhere.</div>
            <div className="relative">
              <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,249,255,0.3)" strokeWidth="5" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#00f9ff" strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={dashOffset} style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-3xl font-bold text-white drop-shadow-xl">{code}</div>
              </div>
              {timeLeft <= 3 && <div className="absolute inset-0 rounded-full blink-eye"></div>}
            </div>
            {timeLeft < 5 ? 
              <div className="text-center text-cyan-100 font-mono text-lg drop-shadow-sm">Closing up soon.</div>
              : <div className="text-center text-cyan-100 font-mono text-lg drop-shadow-sm">...</div>
            }

            <button
              className="w-[60%] py-2 rounded-full border border-[#00f9ff] text-cyan-50 font-semibold glass-card"
              onClick={(e) => { 
                e.preventDefault();
                closePortal();
              }}
            >Close Bifrost
            </button>

          </div>
        )}
        <div className="w-full mt-auto text-slate-400">
          <Footer />
        </div>
      </div>
    );
  }
  // enter Bifrost
  if (isLoggedIn==='F') {
    return (
      <div className="fixed inset-0 flex flex-col pt-40 items-center justify-center bg-gradient-to-b from-gray-900 to-cyan-900 select-none p-4">
        {<Navbar/>}
        {!receiverOpened ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center mb-4">
              <p className="text-white text-2xl font-mono">Initiate BIFROST protocol.</p>
              <p className="text-white text-sm font-mono opacity-80">
                Rapid Login through a secure channel.<br/>Once channelized, you've got 15 minutes, tops.
              </p>
            </div>
            <button onClick={() => setReceiverOpened(true)} className="relative flex items-center justify-center w-48 h-48 rounded-full bg-black bg-opacity-50 backdrop-blur-md border border-cyan-400 shadow-2xl hover:shadow-neon transition-all duration-500">
              <span className="absolute inset-0 rounded-full animate-shimmer"></span>
              <span className="relative text-xl font-semibold text-cyan-200 drop-shadow-lg">Engage Bifrost</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center text-cyan-100 font-mono text-lg drop-shadow-sm ">
              <p className="text-2xl font-mono">Engage Bifrost</p>
              <p className="text-sm font-mono opacity-70">Input the Access Sequence</p>
            </div>
            <div className="relative">
              <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,249,255,0.3)" strokeWidth="5" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#00f9ff" strokeWidth="5" strokeDasharray="283" strokeDashoffset="0" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <input 
                id='code'
                type="tel"
                autoComplete="off"
                className="w-36 px-2 py-1 text-2xl font-bold text-center font-mono bg-transparent text-white drop-shadow-xl border-b border-cyan-400 outline-none"
                value={enteredCode} 
                onChange={e => setEnteredCode(e.target.value)} 
                maxLength="4" 
                placeholder="----" 
                />
              </div>
              {blinkClass && <div className={`absolute inset-0 rounded-full ${blinkClass}`}></div>}
            </div>
            {enteredCode.trim().length===4 && <div className="text-center text-cyan-100 font-mono text-lg drop-shadow-sm">Searching secure channel...</div>}
          </div>
        )}
        <div className="w-full mt-auto text-slate-400">
          <Footer />
        </div>
      </div>
    );
  }
  return null;
};

export default BifrostPage;