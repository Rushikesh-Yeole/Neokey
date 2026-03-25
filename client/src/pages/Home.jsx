import { useContext, useState, useEffect, useRef, useMemo } from "react";
import { assets } from "../assets/assets";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { encrypt, bhash, symDecrypt, hhash, keygen, symEncrypt, arghash } from "../components/aesbox";
import Footer from "../components/Footer";
import Pops from "../components/Pops";
import CredStore from "../components/CredStore";
import { Shield } from 'lucide-react';
import posthog from 'posthog-js';

function isPwa() {
  if (window.navigator.standalone) return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return false;
}

const Banner = ({ render, demo, isPwa, isLoggedIn }) => (
  <div>
    <section className="hidden md:block mr-20 items-center px-10 md:px-20">
      <div className="max-w-3xl space-y-6">
        <h1 className="text-4xl md:text-5xl font-Snapchat font-extrabold text-white leading-tight">
          No Vaults.<br />No Leaks.
        </h1>
        <p className="md:text-base text-pretty text-gray-400 font-mono">
          {!render && <>The password platform that never stores passwords<br />or anything about you.</>}
        </p>
        <div className="flex gap-4">
          <p className="text-pretty text-slate-400">
            {!render && <><br />About ↓{isLoggedIn!='T' && <> • Try demo↗</>}</>}
            {!render && (
              <span
                onClick={() => window.showPopup({
                  title: "Using Neokey",
                  body: <>→ Authorize (Master Password) <br />→ Type/select a service name <br /> → Create password for a service<br /> → Reveal & copy password .<br/> { !demo && isLoggedIn==='T' && <><br/> Tap <Shield className="inline-block align-middle mb-1 text-cyan-400"/> to manually lock the session <br/>(Neokey has autolock) </>} {demo && <><br /> <strong>DEMO</strong> <br />Try Retrieving passwords or Bifrost! <br /><br /> (Reveal for Google, Instagram, X, Netflix...) (Creation disabled for demo.) </>}</>,
                  primaryLabel: "Got it"
                })}
                className="ml-4 text-cyan-300 hover:underline"
              >
                How to ▶
              </span>
            )}
          </p>
        </div>
      </div>
    </section>

    <section className="block md:hidden px-6 mx-auto mb-4 text-xs text-gray-300 text-center">
      {!render && (
        <>
          The password platform that never stores passwords, or anything about you.<br /><br />
          ↓ About •
          {!isPwa() && (
            <span
              onClick={() => window.showPopup({
                title: "Install Neokey",
                body: <>Open your browser menu<br /> "Add to Home screen" to install this app.</>,
                primaryLabel: "Got it"
              })}
              className="ml-1 text-cyan-300 hover:underline"
            >
              Install for better experience ⇩<br /><br/>
            </span>
          )}
          <span
            onClick={() => window.showPopup({
              title: "Using Neokey",
              body: <>→ Authorize (Master Password) <br />→ Type/select a service name <br /> → Create password for a service<br /> → Reveal & copy password .<br/> { !demo && isLoggedIn==='T' && <><br/> Tap <Shield className="inline-block align-middle mb-1 text-cyan-400"/> to manually lock the session <br/>(Neokey has autolock) </>} {demo && <><br /> <strong>DEMO</strong> <br />Try Retrieving passwords or Bifrost! <br /><br /> (Reveal for Google, Instagram, X, Netflix...) (Creation disabled for demo.) </>}</>,
              primaryLabel: "Got it"
            })}
            className="ml-4 text-cyan-300 hover:underline"
          >
            How to ▶
          </span>
        </>
      )}
    </section>
  </div>
);

const VerifyModal = ({ signout, setSignout, unlocking, password, setPassword, handleUnlock, unlockRef, logout, setIsLocked, demo }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-500"></div>

    <div className="relative glass-card p-8 rounded-3xl shadow-2xl w-full max-w-sm mx-6 border border-white/10 animate-pulse-smooth">
      <div className="flex flex-col items-center">
        <div className="p-3 bg-cyan-500/10 rounded-full mb-4">
          <img src={assets.lock_icon} className="w-8 h-8 opacity-80" alt="lock" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Verify</h2>
        {!signout && (
          <p className="text-white text-sm sm:text-base font-semibold mb-6 text-center">
            Your session is locked for security.<br />Enter <span className="text-cyan-400"> master password </span> to continue.
            {demo && <><br/><br/><span className="text-cyan-400"> Password for demo is <b>'key'</b> </span></>}
          </p>
        )}
        {signout && (
          <p className="text-red-400 text-sm sm:text-base font-semibold mb-6 text-center">
            This will terminate your active session.<br />You'll have to Login again.
          </p>
        )}

        <form onSubmit={handleUnlock} className="w-full space-y-4">
          {!signout && (
            <input
              ref={unlockRef}
              id="neokey"
              type="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Master Password"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              required
              autoFocus
              className="w-full bg-slate-900/20 border border-white/10 rounded-full p-1 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-cyan-400 transition-colors text-center tracking-wider"
              disabled={unlocking}
            />
          )}

          <div className="flex justify-center">
            {signout && (
              <button
                data-attr="signout-from-locked-session"
                type="button"
                onClick={() => { logout(); setIsLocked(false); }}
                disabled={unlocking}
                className={`mx-2 w-full bg-red-700/50 hover:bg-red-700/70 text-slate-50 font-medium py-3 rounded-full transition-all duration-300 shadow-sm active:scale-[0.98] ${unlocking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >Sign Out</button>
            )}

            {!signout && (
              <button
                type="button"
                onClick={() => setSignout(true)}
                disabled={unlocking}
                className={`mx-2 w-full bg-black/40 hover:bg-black text-slate-50 font-medium py-3 rounded-full transition-all duration-300 shadow-sm active:scale-[0.98] ${unlocking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >Sign Out</button>
            )}

            {signout && (
              <button
                type="button"
                onClick={() => setSignout(false)}
                className={`mx-2 w-full bg-slate-100 hover:bg-white text-slate-950 font-medium py-3 rounded-full transition-all duration-300 shadow-sm active:scale-[0.98] ${unlocking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >Cancel</button>
            )}

            {!signout && (
              <button
                data-attr="unlock-attempt"
                type="submit"
                disabled={unlocking || signout}
                className={`mx-2 w-full bg-slate-100 hover:bg-white text-slate-950 font-medium py-3 rounded-full transition-all duration-300 shadow-sm active:scale-[0.98] ${unlocking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >{unlocking ? 'Verifying...' : 'Unlock'}</button>
            )}
          </div>
        </form>
      </div>
    </div>
  </div>
);

const OpenGate = ({ isLocked, selectedService, isFocused, suggestions, loadC, loadR, keyVal, handleInputChange, setIsFocused, handleKeyDown, handleSuggestionClick, setShowModal, handleAction, copyToClipboard, setIsLoggedIn, demo }) => (
  <div className={`glass-card px-6 p-6 sm:p-10 rounded-2xl shadow-glass w-full max-w-[90%] sm:max-w-sm text-slate-700 text-sm sm:text-base transition-all duration-500 ${isLocked ? 'blur-sm pointer-events-none opacity-50' : ''}`}>
    {!demo && <Shield data-attr="lock-session-button" onClick={() => { CredStore.wipe(); setIsLoggedIn('N') }} className="text-cyan-200 ml-auto w-6 cursor-pointer" />}
    <button className="w-full text-4xl font-black mt-6 mb-4 text-center py-1.5 rounded-full border border-[#00f9ff] hover:bg-cyan-200 hover:text-slate-700 bg-slate-900 text-cyan-200 relative overflow-hidden">
      Neokey
      <span className="shiny-stripe"></span>
    </button>

    <form autoComplete="off" className="space-y-4">
      <div className="flex items-center gap-3 w-full px-2 py-2.5 rounded-full text-black bg-slate-100">
        <img src={assets.apps} alt="Logo" className="w-6 cursor-pointer" />
        <input
          id="service"
          type="text"
          className="w-full px-1 mx-0 sm:mx-3 rounded-full bg-transparent text-black outline-none"
          placeholder="Type & select a service"
          autoComplete="off"
          required
          value={selectedService}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
        />
        {selectedService && isFocused && suggestions.length > 0 && (
          <ul className="absolute w-full max-w-[60%] sm:max-w-[60%] bg-slate-400 rounded-lg shadow-md top-40 mt-1 sm:mt-8 z-20 max-h-90 overflow-y-visible">
            {suggestions.slice(0, 4).map((suggestion, index) => (
              <li
                key={index}
                className="px-4 py-2 text-white hover:bg-slate-500 cursor-pointer text-[1.25rem]"
                onMouseDown={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-between gap-4">
        <button
          className={`w-full py-2.5 rounded-full shadow-3xl border border-white/20 ${loadC ? "loading-bar" : ""} text-cyan-200 font-medium`}
          onClick={(e) => {
            e.preventDefault();
            if (!selectedService) {
              return toast.error(`Select a Service`, { autoClose: 700 });
            } else {
              setShowModal(true);
              setTimeout(() => { document.getElementById("docreate")?.focus(); }, 100);
            }
          }}
        >
          <span className="font-bold text-base">CREATE</span>
        </button>

        <button
          id="retrieve"
          className={`w-full py-2.5 rounded-full ${keyVal && "bg-cyan-100/60"} border border-white/20 ${loadR ? "loading-bar" : ""} text-cyan-200 font-medium`}
          onClick={(e) => {
            e.preventDefault();
            if (keyVal) { copyToClipboard(keyVal); }
            else { handleAction('retrieve'); }
            window.scrollTo(0, 0);
          }}
        >
          {keyVal === "" ? <span className="font-bold text-base">REVEAL</span> : <span className="font-bold text-white text-base">COPY</span>}
        </button>
      </div>
    </form>

    <div className="mt-3">
      <p className="hidden sm:block w-full mt-3 text-center text-pretty text-slate-500 cursor-pointer">Press Shift to autocomplete</p>
    </div>
  </div>
);

const ConfirmModal = ({ selectedService, scope, sections, setShowModal, setKey, handleAction, switchScope, userServices }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-lg transition-all duration-500"></div>
    <div className="relative glass-card p-6 rounded-3xl shadow-2xl w-full max-w-sm mx-6 border border-white/10">
      <div className="flex flex-col items-center text-center">
        <h3 className="text-xl font-bold text-white mb-2">{userServices.includes(selectedService.toLowerCase()) ? "Create new" : "Create"} password for <span className="text-cyan-400">{selectedService}</span> ? </h3>
        <p className="text-slate-300 text-base font-medium mb-3">
          Select length
        </p>

        <div className="w-full bg-slate-900/50 rounded-full p-1.5 flex items-center justify-between text-sm cursor-pointer select-none mb-8 border border-white/5">
          {sections.map((len) => (
            <div
              key={len}
              onClick={() => switchScope(len)}
              className={`flex-1 text-center py-2 rounded-full transition-all duration-75 font-medium ${scope === len ? "bg-cyan-500/20 border border-cyan-400 text-cyan-100" : "text-slate-400"}`}
            >
              {len}
            </div>
          ))}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 bg-black/40 border border-white/10 text-slate-200 font-medium py-3 rounded-full active:scale-95 transition-transform"
          >Cancel</button>

          <button
            id="docreate"
            autoFocus
            onClick={() => {
              setShowModal(false);
              setKey("");
              handleAction("create");
              setTimeout(() => document.getElementById("retrieve")?.focus(), 100);
            }}
            className="flex-1 bg-slate-100 text-slate-950 font-bold py-3 rounded-full active:scale-95 transition-transform"
          >Create</button>
        </div>
      </div>
    </div>
  </div>
);

const CloseGate = ({ setSignup, navigate }) => (
  <div className="glass-card shadow-glass p-10 w-full max-w-sm rounded-2xl shadow-2xl text-indigo-300 text-sm">
    <button className="w-full text-4xl font-black mt-2 mb-8 text-center py-2 rounded-full border border-[#00f9ff] hover:bg-cyan-200 hover:text-slate-700 bg-slate-900 text-cyan-200 relative overflow-hidden">
      Neokey
      <span className="shiny-stripe"></span>
    </button>
    <h2 className="block md:hidden text-center text-lg font-bold text-gray-100">Secure your Digital Keys</h2>
    <p className="block md:hidden text-center mb-6 text-lg font-bold text-gray-100">No vaults. No leaks.</p>
    <p className="hidden md:block text-center mb-6 text-lg font-semibold text-gray-200">Rest assured, no one knows your passwords, Literally! </p>
    <div className="flex justify-between gap-4">
      <button
        className="w-52 mx-auto block py-2.5 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold"
        onClick={(e) => {
          e.preventDefault();
          setSignup(true);
          navigate('/login');
        }}
      >Sign Up</button>
    </div>
  </div>
);

const FEATURES = [
  {
    key: "f1",
    title: "Phantom Passwords",
    description: <>No passwords stored in anyway. <br />Neokey forges fresh 8-64 character passwords with upto 256 bits of entropy, in runtime, on client-side.</>,
  },
  {
    key: "f2",
    title: "Zero-Trace Architecture",
    description: <>Opaque Indexing. No targets to hit. <br />Privacy by design keeps you invisible to the system. <br/> Nothing collected, nothing retained.</>,
  },
  {
    key: "f3",
    title: "Dynamic Key Versatility",
    description: <>One tap forges a fresh, unique password for any service instantly. Automated rotation eliminates manual versioning.</>,
  },
  {
    key: "f4",
    title: "Secure Transit",
    description: <>Credentials never exist whole in transit. Split-key design and multi-step hashing with RSA and AES layers keeps each fragment useless until runtime reconstruction.</>,
  },
  {
    key: "f5",
    title: "Reinforced Access Control",
    description: <>Every session has auto-lock & demands master password. <br /> Minimal design. Seamless multi-device access.</>,
  },
];

const FeatureBoxes = ({ navigate }) => (
  <div className="h-auto min-h-screen text-white flex flex-col items-center justify-center px-6 sm:px-20 lg:px-20">
    <h1 className="w-full text-3xl sm:text-4xl font-extrabold mt-8 mb-4 text-center py-1.5 rounded-full border border-[#00f9ff] bg-cyan-100 text-slate-700">
      Why It's Different
    </h1>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl auto-rows-fr">
      {FEATURES.map(({ key, title, description }, index) => (
        <div
          key={key}
          className="glass-card p-4 rounded-xl shadow-2xl shadow-glass sm:hover:scale-105 sm:transform sm:transition sm:duration-300"
        >
          <img src={assets[key]} loading="lazy" alt={`Feature Icon ${index + 1}`} className="w-16 h-16 mb-4 mx-auto hover:glow-logo" />
          <h3 className="text-xl font-bold mb-2 text-center">{title}</h3>
          <p className="text-sm text-center">{description}</p>
        </div>
      ))}

      <div className="p-6 rounded-xl">
        <button
          className="m-2 w-full py-2.5 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold text-lg"
          onClick={(e) => { e.preventDefault(); navigate("/faqs"); }}
        >Frequently Asked Things</button>
        <button
          className="m-2 w-full py-2.5 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold text-lg"
          onClick={(e) => { e.preventDefault(); navigate("/contact"); }}
        >Let's Talk!</button>
      </div>
    </div>
  </div>
);

const Home = () => {
  const { backendUrl, isLoggedIn, setIsLoggedIn, publicKey, userServices, fetchServices, demo, setSignup, logout } = useContext(AppContext);
  const navigate = useNavigate();

  const [render, setRender] = useState(true);
  const [selectedService, setSelectedService] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loadR, setLoadR] = useState(false);
  const [loadC, setLoadC] = useState(false);
  const [key, setKey] = useState("");

  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [signout, setSignout] = useState(false);
  const unlockRef = useRef(null);

  const accountOptions = ["Instagram", "AWS", "Google", "Discord", "X", "GitHub", "Teams", "Netflix", "AppleID"];
  const [scope, setScope] = useState("16");
  const sections = ["08", "16", "24", "32", "64"];

  const switchScope = (len) => setScope(len);

  useEffect(() => {
    requestAnimationFrame(() => window.scrollTo(0, 0));
    if (isLoggedIn === 'N') {
      setRender(true);
    } else {
      setRender(false);
      if (isLoggedIn && localStorage.getItem('csalt') && !CredStore.isUnlocked()) {
        setIsLocked(true);
        setTimeout(() => unlockRef.current?.focus(), 100);
      }
    }
  }, [isLoggedIn]);

  const allServices = useMemo(() => [
    ...(userServices.length === 0 ? accountOptions : []),
    ...userServices.map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
  ], [userServices]);

  const correctSpelling = (input) =>
    allServices.find(s => s.toLowerCase().includes(input.toLowerCase()) && input.length > 1) || input;

  const handleInputChange = (e) => {
    const input = e.target.value.trim();
    setSelectedService(input);
    setSuggestions(input ? allServices.filter(s => s.toLowerCase().includes(input.toLowerCase())) : []);
  };

  const handleSuggestionClick = (suggestion) => {
    setSelectedService(suggestion);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Shift") {
      e.preventDefault();
      setSelectedService(correctSpelling(selectedService));
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (unlocking) return;

    const csalt = CredStore.getCsalt();
    if (!csalt) {
      toast.error("Session Corrupted. Please Login again.");
      logout();
      return;
    }

    try {
      setUnlocking(true);
      await new Promise(r => setTimeout(r, 1000));
      const cred = await arghash(password, csalt);
      const snkey = hhash("snkey", cred);
      const cred_hash = hhash("cred", cred); 
      const stub = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
      const cryptcred = await symEncrypt(cred_hash, stub);
      const cryptstub = encrypt(stub, publicKey);

      const { data } = await axios.post(backendUrl + '/auth/exist', { cryptcred, cryptstub });

      if (data.success) {
        CredStore.setSnkey(snkey);
        CredStore.setCred(cred);
        posthog.capture('session_unlocked');
        setIsLocked(false);
        setPassword("");
        fetchServices();
      } else {
        toast.error(data.message);
        setPassword("");
      }
    } catch (error) {
      console.error(error);
      setPassword("");
      const errorMessage = error.response?.data?.message || "Request failed";
      toast.error(errorMessage, { autoClose: 1500 });
    } finally {
      setUnlocking(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setLoadR(false);
      setKey("");
      setSelectedService("");
      toast.success('Key copied to clipboard!', { autoClose: 1500 });
    } catch (err) {
      console.error('Failed to Retrieve', err);
      toast.error('Failed to Retrieve. Contact Us.');
    }
  };

  const handleAction = async (action) => {
    if (!publicKey) { toast.error(`Comms are Down, Contact Us`); return; }
    try {
      let metadata = "";
      if (!selectedService) { return toast.error(`Select a Service`, { autoClose: 700 }); }

      const stub = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
      const svcMetadata = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
      
      if (action === 'retrieve') {
        setLoadR(true);
      } else if (demo) {
        toast.info(<>Can't create/change passwords on Demo account. <br />Please Sign in</>, { autoClose: 2200 }); return;
      } else {
        setLoadC(true);
        metadata = new Date().toISOString().replace(/[-:]/g, '').slice(0, 16);
        metadata = scope + ':' + bhash(metadata, stub);
      }

      const csalt = CredStore.getCsalt();
      const snkey = CredStore.getSnkey();
      const cred = CredStore.getCred();

      if (!csalt || !snkey) {
        setIsLocked(true);
        setLoadR(false);
        setLoadC(false);
        return;
      }

      const svc = selectedService.trim().toLowerCase();
      const sigKey = hhash("sigkey", cred )
      const sign = hhash(svc, sigKey);
      let name = '';
      const cred_hash = hhash("cred", cred);
      if (action === "create") { name = await symEncrypt(svc, snkey); }

      const payload =
        sign.length.toString().padStart(3, '0') + sign +
        cred_hash.length.toString().padStart(3, '0') + cred_hash +
        (name.length.toString().padStart(3, '0') || "") + (name || "") + 
        svcMetadata.length.toString().padStart(3, '0') + svcMetadata;

      const crypt = await symEncrypt(payload, stub);
      const cryptstub = encrypt(stub, publicKey);

      const { data } = await axios.post(`${backendUrl}/user/${action}`, { metadata, crypt, cryptstub });

      if (data.success) {
        if (data.keyhash) {
          let cKey = hhash(await symDecrypt(data.svcmt, stub), cred);
          const derivedKey = keygen(await symDecrypt(data.keyhash, stub), cKey);
          if (!derivedKey) { toast.error(<> Versioning error for {name}. <br /> Please Report to us.</>, { autoClose: 2500 }); setLoadR(false); return; }
          setKey(derivedKey);
          setLoadR(false);
          posthog.capture('password_retrieved');
        } else {
          fetchServices();
          setLoadC(false);
          posthog.capture('password_created', { length: scope });
        }
        toast.success(data.message, { autoClose: 2000 });
      } else {
        setLoadR(false);
        setLoadC(false);
        fetchServices();
        const errorMessage = data?.message || "Request failed";
        toast.error(errorMessage, { autoClose: 1500 });
      }
    } catch (error) {
      setLoadR(false);
      setLoadC(false);
      toast.error(error.message, { autoClose: 1200 });
    }
  };

  return (
    <div className={`min-h-screen sm:px-0 select-none cursor-pointer ${render ? 'bg-black' : 'bg-gradient-to-b from-gray-800 via-cyan-900 to-cyan-950'}`}>
      <Pops />
      {!render && <Navbar />}

      {isLocked && (
        <VerifyModal
          signout={signout}
          setSignout={setSignout}
          unlocking={unlocking}
          password={password}
          setPassword={setPassword}
          handleUnlock={handleUnlock}
          unlockRef={unlockRef}
          logout={logout}
          setIsLocked={setIsLocked}
          demo={demo}
        />
      )}

      <div className="h-screen flex flex-col lg:flex-row items-center justify-center pt-6 sm:pt-16 px-6 sm:px-0">
        <Banner render={render} demo={demo} isPwa={isPwa} isLoggedIn={isLoggedIn} />

        {render ? (
          <div className="flex items-center justify-center">
            <img src={assets.logo} alt="Logo" className="w-40 mb-10 sm:w-52 cursor-pointer glow-logo" />
            <div className="postman-loader">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        ) : isLoggedIn === 'T' ? (
          <OpenGate
            isLocked={isLocked}
            selectedService={selectedService}
            isFocused={isFocused}
            suggestions={suggestions}
            loadC={loadC}
            loadR={loadR}
            keyVal={key}
            demo={demo}
            setIsLoggedIn={setIsLoggedIn}
            handleInputChange={handleInputChange}
            setIsFocused={setIsFocused}
            handleKeyDown={handleKeyDown}
            handleSuggestionClick={handleSuggestionClick}
            setShowModal={setShowModal}
            handleAction={handleAction}
            copyToClipboard={copyToClipboard}
          />
        ) : (
          <CloseGate setSignup={setSignup} navigate={navigate} />
        )}
      </div>

      {showModal && (
        <ConfirmModal
          selectedService={selectedService}
          scope={scope}
          sections={sections}
          setShowModal={setShowModal}
          setKey={setKey}
          handleAction={handleAction}
          switchScope={switchScope}
          userServices={userServices}
        />
      )}

      {!render && <FeatureBoxes navigate={navigate} />}

      <div className="w-full text-slate-400">
        {!render && <Footer />}
      </div>
    </div>
  );
};

export default Home;