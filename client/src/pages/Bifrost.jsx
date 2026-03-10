import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../bifrost.css';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import Navbar from "../components/Navbar";
import Footer from '../components/Footer';
import CredStore from "../components/CredStore";
import { bhash, genEphemeralRSA, ephemeralEncrypt, ephemeralDecrypt, blake } from '../components/aesbox';

// UI component
const TerminalText = ({ text }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const int = setInterval(() => {
      setDots(p => (p.length >= 3 ? '' : p + '.'));
    }, 500);
    return () => clearInterval(int);
  }, []);

  return (
    <span className="text-slate-400 font-mono text-sm tracking-wide inline-block w-60 text-center">
      {text}{dots}
    </span>
  );
};

const HeroButton = ({ onClick, title, subtitle, btnText }) => (
  <div className="flex flex-col items-center justify-center space-y-10 w-full max-w-sm transition-opacity duration-700">
    <div className="text-center space-y-3">
      <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-wide">{title}</h1>
      <p className="text-slate-400 text-sm sm:text-base font-light">{subtitle}</p>
    </div>
    <button 
      onClick={onClick} 
      className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all flex items-center justify-center shadow-lg active:scale-95"
    >
      <span className="text-white font-medium tracking-widest text-sm uppercase">{btnText}</span>
    </button>
  </div>
);

const RingDisplay = ({ children, progress }) => (
  <div className="relative flex items-center justify-center">
    <svg className="w-56 h-56 sm:w-64 sm:h-64 transform -rotate-90" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
      <circle 
        cx="50" cy="50" r="45" fill="none" stroke="rgba(0, 249, 255, 0.5)" strokeWidth="1.5" 
        strokeDasharray="283" 
        strokeDashoffset={283 - (283 * progress)} 
        style={{ transition: 'stroke-dashoffset 1s linear' }} 
        strokeLinecap="round" 
      />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center pl-3">{children}</div>
  </div>
);

// Main engine

const BifrostPage = () => {
  const { backendUrl, isLoggedIn, setIsLoggedIn, demo } = useContext(AppContext);
  const navigate = useNavigate();

  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [code, setCode] = useState("");
  const [reqPubKey, setReqPubKey] = useState(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [receiverOpened, setReceiverOpened] = useState(false);
  const [hasKnocked, setHasKnocked] = useState(false);
  const privKeyRef = useRef(null);
  const isHost = isLoggedIn === 'T';

  useEffect(()=>{
    if (isLoggedIn==='T' && !CredStore.getBsalt()) navigate('/');
  },[isLoggedIn]);


  const heimdall = async (action, data = {}) => {
    try {
      const response = await axios.post(`${backendUrl}/auth/bifrost`, { 
        action, 
        ...data, 
        code: blake(data.code || code), 
      });
      return response.data;
    } catch {
      return { success: false, status: 'ERROR' };
    }
  };

  const closePortal = async () => {
    if (isHost && started && code) await heimdall('close');
    setStarted(false);
    setTimeLeft(60);
    setCode("");
    setEnteredCode("");
    setReqPubKey(null);
    setHasKnocked(false);
    privKeyRef.current = null;
  };

  // Polling
  useEffect(() => {
    if (!started || !code) return;
    let tick = 0;

    const interval = setInterval(async () => {
      setTimeLeft(p => {
        if (p <= 1) {
          closePortal();
          return 0;
        }
        return p - 1;
      });

      if (++tick % 2 !== 0) return;

      if (isHost && !reqPubKey) {
        const res = await heimdall('poll_host');
        if (res.status === 'CLOSED') {
          toast.error("Session expired", res.message);
          closePortal();
        } else if (res.status === 'KNOCKING') {
          setReqPubKey(res.pubKey);
        }
      } 
      else if (!isHost && privKeyRef.current !== 'done') {
        const res = await heimdall('join_poll');
        if (res.status === 'CLOSED') {
          toast.error("Closed by host");
          closePortal();
        } else if (res.status === 'WAITING' && hasKnocked) {
          toast.error("Host declined");
          setStarted(false);
          setHasKnocked(false);
          setEnteredCode("");
        } else if (res.status === 'PAYLOAD' && privKeyRef.current) {
          try {
            const pk = privKeyRef.current;
            privKeyRef.current = 'done';
            const { c, s } = JSON.parse(await ephemeralDecrypt(pk, res.payload));
            const enterRes = await heimdall('enter', { secret: s });

            if (enterRes.success) {
              localStorage.setItem("token", enterRes.token);
              localStorage.setItem("csalt", c);
              axios.defaults.headers["Authorization"] = `Bearer ${enterRes.token}`;
              setIsLoggedIn("N");
              toast.success(<>Sync complete <br/> Session active for 45 min.</>);
              setTimeout(() => navigate('/'), 1000);
            } else {
              throw new Error();
            }
          } catch {
            toast.error("Integrity failed");
            closePortal();
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [started, code, reqPubKey, isHost, hasKnocked]);

  // User actions
  const initSender = async () => {
    if (!CredStore.getCsalt()) return toast.error("Verification required");
    const gCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCode(gCode);
    const res = await heimdall('open', { code: gCode });
    if (res.success) setStarted(true); else toast.error("Init failed");
  };

  const dropPayload = async () => {
    try {
      const secret = crypto.getRandomValues(new Uint8Array(16))
        .reduce((a, b) => a + b.toString(16).padStart(2, '0'), '');
      const payloadStr = JSON.stringify({ c: localStorage.getItem('csalt'), s: secret });
      const encPayload = await ephemeralEncrypt(payloadStr, reqPubKey);
      
      const res = await heimdall('drop', { payload: encPayload, secretHash: bhash(secret, blake(code)) });
      if (res.success) {
        setReqPubKey("SENT");
        setTimeout(() => { closePortal() }, 2000);
      }
    } catch {
      toast.error("Sequence failed");
    }
  };

  const initReceiver = async (inputCode) => {
    document.activeElement.blur();
    setCode(inputCode);
    try {
      const { privateKey, publicKeyB64 } = await genEphemeralRSA();
      privKeyRef.current = privateKey;
      const res = await heimdall('join_poll', { code: inputCode, pubKey: publicKeyB64 });
      if (res.status !== 'CLOSED') {
        setStarted(true);
        setHasKnocked(true);
      } else {
        toast.error("Invalid sequence");
        setEnteredCode("");
      }
    } catch {
      toast.error("KeyGen failed");
    }
  };

  // Render
  if (isLoggedIn === 'N') return null;

  return (
    <div className="flex flex-col items-center pt-32 mb-auto justify-center min-h-screen bg-cyan-950 select-none p-0 font-sans overflow-hidden">
      <Navbar />

      {!started && !receiverOpened ? (
        <HeroButton 
          title="Bifrost" 
          subtitle={isHost ? <>End-to-end encrypted session transfer <br/> Open Bifrost to activate a 45 minute remote session.</> : <>Securely join an active session for 30 minutes.</>} 
          btnText={isHost ? "Open" : "Engage"} 
          onClick={isHost ? initSender : () => setReceiverOpened(true)} 
        />
      ) : (
        <div className="mt-0 flex flex-col items-center space-y-4 w-full animate-fade-in">
          <div className="text-center space-y-1">
            <h2 className="text-2xl text-white font-medium">
              {isHost ? "Bifrost Open" : "Join Bifrost"}
            </h2>
            <p className="text-white text-base font-light">
              {isHost ? <>Use code to enter bifrost on new device<br/>Active for only 60 seconds.</> : "Input code from host device"}
            </p>
          </div>

          <RingDisplay progress={isHost ? (timeLeft / 60) : (started ? 1 : 0)}>
            {isHost || started ? (
              <div className="text-4xl font-bold text-white tracking-[0.3em]">{code}</div>
            ) : (
              <input 
                type="tel" 
                autoFocus 
                className="w-full text-3xl font-bold tracking-[0.3em] text-center bg-transparent text-white focus:border-cyan-400 outline-none transition-colors" 
                value={enteredCode} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setEnteredCode(val);
                  if (val.length === 6) initReceiver(val);
                }} 
                maxLength="6" 
                placeholder="------" 
                disabled={started} 
              />
            )}
          </RingDisplay>

          <div className="flex items-center justify-center w-full px-4">
            {isHost ? (
              reqPubKey && reqPubKey !== "SENT" ? (
                <div className="w-full max-w-xs sm:max-w-sm glass-card rounded-2xl p-4 border border-white shadow-2xl backdrop-blur-xl flex flex-col items-center space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-white font-medium">Connection Request</h3>
                    <p className="text-xs text-slate-400 font-mono">RSA-2048 VERIFIED</p>
                  </div>
                  <div className="flex w-full gap-4">
                    <button 
                      onClick={async () => { setReqPubKey(null); await heimdall('open', { code }); }} 
                      className="flex-1 py-2.5 rounded-full border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={dropPayload} 
                      className="flex-1 py-2.5 rounded-full bg-cyan-100 text-slate-900 text-sm hover:bg-white transition-colors"
                    >
                      Authorize
                    </button>
                  </div>
                </div>
              ) : reqPubKey === "SENT" ? (
                <TerminalText text="Syncing session" />
              ) : (
                <div className="flex flex-col items-center space-y-10">
                  <TerminalText text="Waiting for reciever" />
                  <button 
                    className="text-slate-600 font-medium text-xs tracking-widest uppercase hover:text-white" 
                    onClick={closePortal}
                  >
                    Terminate
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center space-y-6">
                {started && <TerminalText text="Awaiting host approval" />}
                <button 
                  className="text-slate-600 font-medium text-xs tracking-widest uppercase hover:text-white" 
                  onClick={() => { closePortal(); setReceiverOpened(false); }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="w-full mt-auto text-slate-500">
        <Footer />
      </div>
    </div>
  );
};

export default BifrostPage;