import { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { encrypt, bhash, arghash, symDecrypt} from "../components/aesbox";
import Footer from "../components/Footer";
import Pops from "../components/Pops";

const Home = () => {
  const { backendUrl, isLoggedIn, publicKey, userServices, fetchServices, demo } = useContext(AppContext);
  const navigate = useNavigate();
  const [render, setRender] = useState(true);
  const [selectedService, setSelectedService] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loadR, setLoadR] = useState(false);
  const [loadC, setLoadC] = useState(false);
  const [key, setKey] = useState("");
  const accountOptions = ["Instagram", "Snapchat", "Google", "Facebook", "X", "LinkedIn"];
  const [scope, setScope] = useState(`16`);
  const sections = [`08`, `16`, `20`, `64`];

  const switchScope = (len) => {
    setScope(len);
    };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (isLoggedIn === 'N') {
      setRender(true);
    } else {
      setRender(false);
    }
  }, [isLoggedIn]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setLoadR(false);
      setKey("");
      setPassword("");
      setSelectedService("");
      toast.success('Key copied to clipboard!',{ autoClose: 1500});
    } catch (err) {
      console.error('Failed to Retrieve', err);
      toast.error('Failed to Retrieve. Contact Us.');
    }
  };

  function isPwa() {
  if (window.navigator.standalone) return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return false;
}
  
// Merge accountOptions and userServices, prefer accountOptions, and remove case-insensitive duplicates
const mergeServices = () => [
  ...accountOptions,
  ...userServices
    .filter(service => !accountOptions.some(opt => opt.toLowerCase() === service.toLowerCase()))
    .map(service => service.charAt(0).toUpperCase() + service.slice(1).toLowerCase())
];

// Spell correction function
const correctSpelling = (input) => {
  let allServices = mergeServices();
  return allServices.find(service => service.toLowerCase().includes(input.toLowerCase()) && input.length > 1) || input;
};

// Handle input change and filter suggestions
const handleInputChange = (e) => {
  const input = e.target.value.trim();
  setSelectedService(input);
  setSuggestions(input ? mergeServices().filter(service => service.toLowerCase().includes(input.toLowerCase())) : []);
};

  const handleSuggestionClick = (suggestion) => {
    setSelectedService(suggestion);
    setSuggestions([]);
    setTimeout(()=>{document.getElementById("neokey")?.focus()},0);
  };

  const handleKeyDown = (e) => {
  if (e.key === "Shift") {
    e.preventDefault();
    setSelectedService(correctSpelling(selectedService));
    setTimeout(()=>{document.getElementById("neokey")?.focus()},1);
  }
};

  const handleAction = async (action) => {
    if(!publicKey){toast.error(`Comms are Down, Contact Us`); return;}
    try {
      let metadata = "";
      let csalt = "";
      // let start = performance.now();
      let lock = selectedService.trim().toLowerCase();
      if(!password || !lock){return toast.error(`Enter Requirements`,{ autoClose: 700})};
      
      if(action==='retrieve'){setLoadR(true);}
      else if(demo){
        toast.info("Can't create new passwords on Demo account. Please Sign in",{ autoClose: 2200}); return;
      }
      else{
        setLoadC(true);
        metadata = new Date().toISOString().replace(/[-:]/g, '').slice(0, 16);
        const stub = crypto.getRandomValues(new Uint8Array(32)).reduce((s,b)=>s+b.toString(16).padStart(2,'0'),'');
        csalt = crypto.getRandomValues(new Uint8Array(32)).reduce((s,b)=>s+b.toString(16).padStart(2,'0'),'');
        metadata = scope + ':' + bhash(metadata, stub);
      };
      
      let cred =  bhash(password, localStorage.getItem("csalt"));
      let bsalt = localStorage.getItem("bsalt");
      if (action==='retrieve') { csalt = bhash(lock, bhash(password, cred)) };

      const payload =
        lock.length.toString().padStart(2, '0') + lock +
        cred.length.toString().padStart(3, '0') + cred +
        bsalt.length.toString().padStart(3, '0') + bsalt +
        csalt;
      const crypt = encrypt(payload, publicKey);
            
      let { data } = await axios.post(`${backendUrl}/user/${action}`, { metadata, crypt });
      let end = performance.now();
      // let timeTaken = end - start;
      // console.log(`${action} time : ${timeTaken.toFixed(2)} ms`);
      
      if (data.success) {
        if(data.key){
          setPassword("");
          setKey(await symDecrypt(data.key, csalt));
          setLoadR(false);
        } else { fetchServices(); setLoadC(false); };
        toast.success(data.message,{ autoClose: 2000});
      } else {
          setLoadR(false);
          setLoadC(false);
          toast.error(data.message,{ autoClose: 1500});
        }
    } catch (error) {
      setLoadR(false);
      setLoadC(false);
      toast.error(error.message,{ autoClose: 1200});
    }
  };

  const Banner = () => (
    <div>
  <section className="hidden md:block mr-32 items-center px-10 md:px-20">
    <div className="max-w-3xl space-y-6">
      <h1 className="text-4xl md:text-6xl font-Snapchat font-extrabold text-white leading-tight">
        No Vaults.<br />No Leaks.
      </h1>
      <p className="md:text-base text-pretty text-gray-400 font-mono">
        {!render && <>The password platform that never stores passwords<br />or anything about you.</>}
      </p>
      <div className="flex gap-4">
        <p className="text-pretty text-slate-400"> 
          {!render && <><br/>About ↓</>}
          {!render && <span
            onClick={() => window.showPopup({
              title: "Using Neokey",
              body: <>Type/select a service name<br/> → Enter master password<br/> → Create password for a service<br/> → Retrieve password & copy it!<br/>{demo && <><br/> <strong>DEMO</strong> <br/> Demo account Neokey password : <strong>fomo</strong> <br/>Try Retrieving passwords or Bifrost logins! </>}</>,
              primaryLabel: "Got it"
            })}
            className="ml-4 text-cyan-300 hover:underline"
          >
            How to ▶
          </span>}
        </p>
      </div>
    </div>
  </section>
  <section className="block md:hidden px-6 mx-auto mb-4 text-xs text-gray-300 text-center">
  {!render && (
    <>
      The password platform that never stores passwords, or anything about you.<br /><br />
      ↓ About •
      {!isPwa() && <span
        onClick={() => window.showPopup({
          title: "Install Neokey",
          body: <>Open your browser menu<br/> "Add to Home screen" to install this app.</>,
          primaryLabel: "Got it"
        })}
        className="ml-1 text-cyan-300 hover:underline"
      >
        Install for better experience ⇩<br/>
      </span>}
        {!render && <span
          onClick={() => window.showPopup({
            title: "Using Neokey",
            body: <>Type/select a service name<br/> → Enter master password<br/> → Create password for a service<br/> → Retrieve password & copy it!<br/>{demo && <><br/> <strong>DEMO</strong> <br/> Demo account Neokey password : <strong>fomo</strong> <br/>Try Retrieving passwords or Bifrost logins! </>}</>,
            primaryLabel: "Got it"
          })}
          className="ml-4 text-cyan-300 hover:underline"
        >
          How to ▶
        </span>}

    </>
  )}
</section>

  </div>
);
  
  const openGate = () => (
    <div className="glass-card px-6 sm:p-10 rounded-2xl shadow-glass w-full max-w-[90%] sm:max-w-sm text-slate-700 text-sm sm:text-base">
      <button className="w-full text-4xl font-black mt-8 mb-4 text-center py-1.5 rounded-full border border-[#00f9ff] hover:bg-cyan-200 hover:text-slate-700 bg-slate-900 text-cyan-200 relative overflow-hidden">
        Neokey
        <span className="shiny-stripe"></span>
      </button>
      <form className='autocomplete="off" space-y-4'>
        <div className="flex items-center gap-3 w-full px-2 py-2.5 rounded-full text-black bg-slate-100">
            {<img src={assets.apps} alt="Logo" className="w-6 cursor-pointer" />}
          <input
            id="service"
            type="text"
            className="w-full px-1 rounded-full bg-transparent text-black outline-none"
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
            <ul className="absolute w-full max-w-[60%] sm:max-w-[60%] bg-[#444C66] rounded-lg shadow-md top-40 mt-1 sm:mt-8 z-20 max-h-90 overflow-y-visible">
              {suggestions.slice(0,4).map((suggestion, index) => (
                <li
                  key={index}
                  className="px-4 py-2 text-white hover:bg-[#555E7D] cursor-pointer text-[1.25rem]"
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Password input */}
        <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-black bg-slate-100">        
          <img src={assets.lock_icon} alt="" />
          <input
            id="neokey"
            onChange={(e) => setPassword(e.target.value.trim())}
            value={password}
            className="px-2 bg-transparent outline-none w-full"
            type="new-password"
            style={{ WebkitTextSecurity: "disc" }}
            placeholder="Neokey password"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            required
            onBlur={window.scrollTo(0, 0)}
          />
        </div>
        {/* Action buttons */}
        <div className="flex justify-between gap-4">
          <button
            className={`w-full py-2.5 rounded-full shadow-3xl border border-[#00f9ff] ${loadC? "loading-bar":"" } text-cyan-200 font-medium`}
            onClick={(e) => { 
            e.preventDefault();
            if (!password || !selectedService) {
            {return toast.error(`Enter Requirements`,{ autoClose: 700})};
            }else{
              setShowModal(true);
              setTimeout(() => {document.getElementById("docreate")?.focus();}, 100);
            }}}
          >
            Create
          </button>
          <button
            id="retrieve"
            className={`w-full py-2.5 rounded-full border border-[#00f9ff] ${loadR? "loading-bar":"" } text-cyan-200 font-medium`}
            onClick={(e) => { 
              e.preventDefault(); 
              if(key){copyToClipboard(key)}
              else{handleAction('retrieve');}
              window.scrollTo(0, 0);
            }}
          > {key=="" ? `Retrieve`:`Copy`}
          </button>
        </div>
      </form>
      <div className="mt-3 ">
      <p className="hidden sm:block w-full mt-3 text-center text-pretty text-slate-500 cursor-pointer">Press Shift to autocomplete</p>
      {/* <p className="w-full mt-1 rounded-full text-center text-pretty text-slate-500 cursor-pointer"> Geek Out Below ↓</p> */}
      </div>
    </div>
  );

  const confirmModal = () => (
     <div className="fixed inset-0 bg-transparent/50 flex justify-center items-center z-50">
      <div className="glass-card p-6 rounded-2xl text-white w-80">
        <h3 className="text-xl font-semibold mb-4">
          Sure about creating a new password for {selectedService}?
        </h3>

        {/* === Capsular Slider === */}
        <div className="flex justify-between mb-4">
          <div className="relative flex-1 mx-2 bg-slate-400/40 rounded-full p-1 flex items-center justify-between text-sm cursor-pointer select-none">
            {sections.map((len) => (
              <div
                key={len}
                onClick={() => switchScope(len)}
                className={`flex-1 text-center py-2 rounded-full transition-colors duration-300
                  ${scope === len ? "bg-gradient-to-br border border-teal-glow from-sky-700 to-blue-900" : ""}
                `}
              >
                {len} char
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            id="docreate"
            className="px-12 py-2 rounded-full border border-[#00f9ff] bg-gradient-to-br from-sky-900 to-blue-950 text-white"
            onClick={() => {
              setShowModal(false);
              setKey("");
              handleAction("create");
              setTimeout(() => {
                document.getElementById("retrieve")?.focus();
              }, 100);
            }}
          >
            Yes
          </button>
          <button
            id="nocreate"
            className="px-12 py-2 rounded-full border border-[#00f9ff] bg-gradient-to-br from-sky-500 to-sky-950 text-white"
            onClick={() => setShowModal(false)}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );

  const closeGate = () => (
    <div className="glass-card shadow-glass p-10 w-full max-w-sm rounded-2xl shadow-2xl text-indigo-300 text-sm">
      <button className="w-full text-4xl font-black mt-2 mb-8 text-center py-2 rounded-full border border-[#00f9ff] hover:bg-cyan-200 hover:text-slate-700 bg-slate-900 text-cyan-200 relative overflow-hidden">
        Neokey
        <span className="shiny-stripe"></span>
      </button>
      <h2 className="block md:hidden text-center text-lg font-bold text-gray-100">Secure your Digital Keys</h2>
      <p className="block md:hidden text-center mb-6 text-lg font-bold text-gray-100">No vaults. No leaks.</p>
      <p className="hidden md:block text-center mb-6 text-lg font-semibold text-gray-400">Rest assured, no one knows your passwords, Literally! </p>
      <div className="flex justify-between gap-4">
          {/* <button
            className="w-52 py-2.5 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold"
            onClick={(e) => { 
              e.preventDefault();
              navigate('/stats');
            }}
          >View Stats
          </button> */}
          <button
            className="w-52 mx-auto block py-2.5 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold"
            onClick={(e) => { 
              e.preventDefault();
              navigate('/login');
            }}
          >Sign Up
          </button>
      </div>
    </div>
  );

const featureBoxes = () => {
  const features = [
    {
      img: assets.f1,
      title: "Phantom Passwords",
      description:
        <>No storage. No encryption. Nothing to steal. <br></br>Neokey forges fresh 8-64 character passwords with 120+ bits of entropy, in runtime. <br></br>Unauthorized access mathematically impossible.</>,
    },
    {
      img: assets.f2,
      title: "Zero-Trace Architecture",
      description:
        <>No sensitive data stored. No targets to hit. <br></br>Privacy by design keeps you invisible to the system with nothing collected, nothing retained.</>,
    },
    {
      img: assets.f3,
      title: "Dynamic Key Versatility",
      description:
        <>One tap. Infinite unique passwords for any service. <br></br>No reuse, no memory, no trace.</>,
    },
    {
      img: assets.f4,
      title: "End-to-End Fortress",
      description:
        "Advanced encryption and irreversible hashing protect or destroy sensitive data in transit. 2FA guards the gate.",
    },
    {
      img: assets.f5,
      title: "Reinforced Access Control",
      description:
        <>Every sensitive action demands your master key. <br></br>Sessions hold no power — only you do. <br></br> Minimal design. Seamless multi-device access.</>,
    },
  ];

  return (
    <div className="h-auto min-h-screen text-white flex flex-col items-center justify-center px-6 sm:px-20 lg:px-20 animate-pulse-smooth">
      <h1 className="w-full text-3xl sm:text-4xl font-extrabold mt-8 mb-4 text-center py-1.5 rounded-full border border-[#00f9ff] bg-cyan-100 text-slate-700">
        Why It's Different
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl auto-rows-fr">
        {features.map(({ img, title, description }, index) => (
          <div
            key={index}
            className="glass-card p-6 rounded-xl shadow-2xl shadow-glass hover:scale-110 transform transition duration-500"
          >
            <img src={img} alt={`Feature Icon ${index + 1}`} className="w-16 h-16 mb-4 mx-auto" />
            <h3 className="text-xl font-bold mb-2 text-center">{title}</h3>
            <p className="text-sm text-center">{description}</p>
          </div>
        ))}
        
        <div className="p-6 rounded-xl">
        <button
          className="m-2 w-full py-2.5 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold text-lg"
          onClick={(e) => {
            e.preventDefault();
            navigate("/faqs");
          }}
        >Frequently Asked Things
        </button>
        <button
          className="m-2 w-full py-2.5 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold text-lg"
          onClick={(e) => {
            e.preventDefault();
            navigate("/contact");
          }}
        >Let's Talk!
        </button>
      </div>
    </div>
    </div>
  );
};


  return (
    <div className={`min-h-screen sm:px-0 select-none cursor-pointer animate-pulse-smooth ${render ? 'bg-black' : 'bg-gradient-to-b from-gray-900 via-cyan-900 to-cyan-950'}`}>
     <Pops /> 
    {!render && <Navbar />}
      {/* First Section */}
    <div className="h-screen flex flex-col lg:flex-row items-center justify-center pt-6 sm:pt-16 px-6 sm:px-0 animate-pulse-smooth">
      {Banner()}
      {render ?  
      <div className="flex items-center justify-center">
        <div className="postman-loader">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    : (isLoggedIn==='T') ? openGate() : closeGate()}
      </div>
      {showModal && confirmModal()}

      {/* Third Section */}
      {!render ? featureBoxes() : null}
      <div className="w-full text-slate-400 ">
      {!render &&<Footer />}
      </div>
    </div>
  );
};

export default Home;