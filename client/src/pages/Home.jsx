import { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { bhash, encrypt, hash} from "../components/aesbox";
import Footer from "../components/Footer";

const Home = () => {
  const { backendUrl, isLoggedIn, publicKey, userServices, setUserServices, fetchServices } = useContext(AppContext);
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
  const sections = [`08`, `16`, `20`];

  const switchScope = (len) => {
    setScope(len);
    };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const checkAuthState = async () => {
      const interval = setInterval(async () => {
        if (isLoggedIn != 'N') {
          setRender(false);
          clearInterval(interval);
        }}, 1000);
    };
    window.scrollTo(0, 0);
    
    if(isLoggedIn=='N'){checkAuthState();}else{setRender(false)};
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
  };

  // Handle focus loss and auto-correct the service name
  // const handleBlur = () => {
  //   setSelectedService(correctSpelling(selectedService));
  //   // setSelectedService(selectedService);
  //   setIsFocused(false);
  // };

  const handleKeyDown = (e) => {
  if (e.altKey && e.key.toLowerCase() === "a") {
    e.preventDefault();
    setSelectedService(correctSpelling(selectedService));
  }
};

  const handleAction = async (action) => {
    if(!publicKey){toast.error(`Comms are Down, Contact Us`); return;}
    try {
      let timestamp = "";
      let start = performance.now();
      let lock = selectedService.trim().toLowerCase();
      if(!password || !lock){return toast.error(`Enter Requirements`,{ autoClose: 700})};
      if(action==='retrieve'){setLoadR(true);}
      else{
        setLoadC(true);
        timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 16);
        timestamp = scope+bhash(timestamp);
      };
      let cryptpassword = hash(password, localStorage.getItem("email"));
      let cryptlock = encrypt(lock, publicKey);
      let cryptsalt = encrypt(localStorage.getItem("email"), publicKey);
      
      let { data } = await axios.post(`${backendUrl}/user/${action}`, { cryptpassword, cryptlock, timestamp, cryptsalt });
      let end = performance.now();
      let timeTaken = end - start;
      console.log(`${action} time : ${timeTaken.toFixed(2)} ms`);
      
      if (data.success) {
        setLoadC(false);
        if(data.key){
          setPassword("");
          setKey(data.key);
          delete data.key;
        }else{fetchServices()};
        toast.success(data.message,{ autoClose: 1700});
        axios.head(`${backendUrl}/admin/${action}d`).catch(()=>{});
      } else {
          setLoadR(false);
          setLoadC(false);
          toast.error(data.message,{ autoClose: 1500});
        }
    } catch (error) {
      setLoadR(false);
      setLoadC(false);
      toast.error(error.message,{ autoClose: 1000});
    }
  };

  const Banner = () => (
  <section className="hidden md:block mt-16 mb-8 mr-32 items-center px-10 md:px-20">
    <div className="max-w-3xl space-y-6">
      <h1 className="text-4xl md:text-6xl font-Snapchat font-bold text-white leading-tight">
        No Vaults.<br />No Leaks.
      </h1>
      <p className="md:text-xl text-gray-400">
        Secure your Digital Keys.
      </p>
      <div className="flex gap-4">
      </div>
    </div>
  </section>
);
  
  const openGate = () => (
    <div className="glass-card p-4 sm:p-10 rounded-lg shadow-glass w-full max-w-[90%] sm:max-w-sm text-slate-700 text-sm sm:text-base">
      <button className="w-full text-4xl font-extrabold mt-8 mb-4 text-center py-1.5 rounded-full border border-[#00f9ff] hover:bg-cyan-200 hover:text-slate-700 bg-slate-900 text-cyan-200 relative overflow-hidden">
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
            onChange={(e) => setPassword(e.target.value.trim().toLowerCase())}
            value={password}
            className="px-2 bg-transparent outline-none w-full"
            type="new-password"
            style={{ WebkitTextSecurity: "disc" }}
            placeholder="NeoKey password"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            required
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
      <p className="w-full mt-3 text-center text-pretty text-slate-500 cursor-pointer">Alt+a for autocomplete</p>
      <ul onClick={scrollToBottom} className="w-full mt-1 rounded-full text-center text-pretty text-slate-500 cursor-pointer"> Geek Out Below ↓</ul>
      </div>
    </div>
  );

  const confirmModal = () => (
     <div className="fixed inset-0 bg-slate-700 bg-opacity-100 flex justify-center items-center z-50">
      <div className="bg-slate-900 p-6 rounded-lg text-white w-80">
        <h3 className="text-xl font-semibold mb-4">
          Sure about creating a new password for {selectedService}?
        </h3>

        {/* === Capsular Slider === */}
        <div className="flex justify-between mb-4">
          <div className="relative flex-1 mx-2 bg-slate-800 rounded-full p-1 flex items-center justify-between text-sm cursor-pointer select-none">
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
    <div className="glass-card shadow-glass p-10 w-full max-w-sm rounded-lg shadow-2xl text-indigo-300 text-sm">
      <button className="w-full text-4xl font-extrabold mt-2 mb-8 text-center py-2 rounded-full border border-[#00f9ff] hover:bg-cyan-200 hover:text-slate-700 bg-slate-900 text-cyan-200 relative overflow-hidden">
        Neokey
        <span className="shiny-stripe"></span>
      </button>
      <h2 className="block md:hidden text-center text-lg font-semibold text-gray-50">Secure your Digital Keys</h2>
      <p className="block md:hidden text-center mb-6 text-lg font-semibold text-gray-50">No vaults. No leaks.</p>
      <p className="hidden md:block text-center mb-6 text-lg text-gray-400">Rest assured, no one knows your passwords, Literally! </p>
      <div className="flex justify-between gap-4">
          {/* <button
            className="w-full py-2.5 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold"
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
      <div className="flex justify-between">
      <ul onClick={scrollToBottom} className="w-full mt-3 rounded-full text-center text-pretty text-slate-500 "> Geek Out Below ↓</ul>
      </div>
    </div>
  );

const featureBoxes = () => {
  const features = [
    {
      img: assets.f1,
      title: "Phantom Passwords",
      description:
        "Passwords aren't stored—our tech forges unique, HMAC-powered 16-charactered 92+ bits entropy, Robust Passwords on demand. Runtime inputs ensure secure regeneration, making unauthorized attempts impossible.",
    },
    {
      img: assets.f2,
      title: "Zero-Trace Architecture",
      description:
        "No sensitive backend data storage, no attack vectors—privacy by design keeps user identities fully Anonymous to system, with no collection or retention of identifiable information.",
    },
    {
      img: assets.f3,
      title: "Dynamic Key Versatility",
      description:
        "Generate multiple unique passwords for the same service securely. Reset NeoKey without affecting previously generated passwords, ensuring seamless control.",
    },
    {
      img: assets.f4,
      title: "Fortified End-to-End Security",
      description:
        "Advanced encryption protects your data as it moves between your device and our servers, while secure email-based OTPs keep your login safe—even during longer sessions.",
    },
    {
      img: assets.f5,
      title: "Reinforced Access Control",
      description:
        "Password generation demands the NeoKey, even during active sessions, ensuring constant security. Minimalistic design eliminates conventional attack surfaces for unparalleled protection.",
    },
  ];

  return (
    <div className="h-auto min-h-screen text-white flex flex-col items-center justify-center px-6 sm:px-20 lg:px-20 animate-pulse-smooth">
      <h1 className="w-full text-3xl sm:text-4xl font-extrabold mt-8 mb-4 text-center py-1.5 rounded-full border border-[#00f9ff] bg-cyan-100 text-slate-700">
        Why It's Different
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
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
          className="m-2 w-full py-2.5 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-medium text-lg"
          onClick={(e) => {
            e.preventDefault();
            navigate("/fats");
          }}
        >Frequently Asked Things
        </button>
        <button
          className="m-2 w-full py-2.5 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-medium text-lg"
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
    {!render && <Navbar />}
      {/* First Section */}
    <div className="h-screen flex flex-col lg:flex-row items-center justify-center pt-16 px-6 sm:px-0 animate-pulse-smooth">
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
      <div className="w-full text-slate-400">
      {!render &&<Footer />}
      </div>
    </div>
  );
};

{/* <div className="w-full text-center text-gray-500 text-sm select-none">
A <span className="font-semibold text-cyan-300">Rushikesh Yeole</span> Production
</div> */}

export default Home;