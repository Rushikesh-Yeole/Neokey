import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { symDecrypt, localDecrypt, wipeLocalKey } from "../components/aesbox";
import CredStore from "../components/CredStore";

export const AppContext = createContext();

function AppContextProvider ({children}) {

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [isLoggedIn, setIsLoggedIn] = useState("N");
  const [authAccess, setAuthAccess] = useState(true);
  const [publicKey, setPublicKey] = useState(null);
  const [symKey, setSymKey] = useState(null);
  const [userServices, setUserServices] = useState([]);
  const [alias, setAlias] = useState("...");
  const [demo, setDemo] = useState(false);
  const [signup, setSignup] = useState(false);
  const [recoveryPdf, setRecoveryPdf] = useState(false);
  const [prod, setProd] = useState(backendUrl!==import.meta.env.VITE_LOCAL_BACKEND_URL);

  useEffect(() => {
    axios.defaults.withCredentials = true;
    const timer = setTimeout(getAuthState, (isLoggedIn=="N"? 500 : 1200 ));
    return () => clearTimeout(timer);
    }, [isLoggedIn]);

  const logout = () => {
    localStorage.clear();
    wipeLocalKey();
    CredStore.wipe();
    setIsLoggedIn('F');
    setUserServices([]);
    setAlias("...");
  };

  const getAuthState = async () => {
    try {
        let encToken = localStorage.getItem("token");
        let token = encToken ? await localDecrypt(encToken) : "";

        axios.defaults.headers["Authorization"] = `Bearer ${token}`;
        let { data } = await axios.get(backendUrl + '/auth/is-auth');
        if (data.success) {
          setDemo(data.demo);
          // soft-lock
          const storedCsalt = await symDecrypt(localStorage.getItem("csalt"), data.saltKey);
          if (storedCsalt) { CredStore.setCsalt(storedCsalt); }
          setIsLoggedIn('T');
        } else {
          setIsLoggedIn('F');
          localStorage.clear();
          wipeLocalKey();
        }
      } catch (error) {
        toast.error(error.message);
      }
  };

  useEffect(() => {
    const handleWipe = () => setIsLoggedIn("N");
    {!isLoggedIn && toast.info("Session auto-locked for security", { autoClose: 2000 })}
    window.addEventListener('credstore-wiped', handleWipe);
    return () => window.removeEventListener('credstore-wiped', handleWipe);
  }, []);

  const fetchServices = async () => {
    try {
      const snkey = CredStore.getSnkey();
      if (!snkey) return;

      const { data } = await axios.post(`${backendUrl}/user/services`);

      const clean = (await Promise.all(
        (data?.services || []).map(s =>
          symDecrypt(s, snkey).catch(() => null)
        )
      )).filter(Boolean);

      setUserServices(clean);
      setAlias(data?.alias || "Phoenix");

      return clean;
    } catch (err) {
      console.error(err);
      setUserServices([]);
      return [];
    }
  };
  
  useEffect(() => {
  isLoggedIn==='T' && fetchServices();
  }, [isLoggedIn]);


  useEffect(() => {
    if (!publicKey) {
      fetchPublicKey();
      access();
    }
  }, [publicKey]);

  const access = async () => {
    const {data} = await axios.get(`${backendUrl}/admin/access`);
    if(!data.success){
      setAuthAccess(false);
      console.log(`Seems authentication systems are down.`);
    }
  }

  const fetchPublicKey = async () => {
    try {
      let response = await axios.get(backendUrl + '/user/public-key');
      if(response.data.publicKey){console.log(`Comms are fully operational.`)}else{toast.error(`Comms have failed. Please contact us`)};
      setPublicKey(response.data.publicKey);
      setSymKey(response.data.publicKey.toString() .replace(/-----(BEGIN|END)[\w\s]+-----/g, "") .replace(/\s+/g, ""));
    } catch (error) {
      console.error("Error fetching public key", error);
    }
  };  
  
  const value = {
    publicKey,
    backendUrl,
    authAccess,
    setAuthAccess,
    isLoggedIn,
    setIsLoggedIn,
    userServices,
    setUserServices,
    fetchServices,
    alias,
    demo,
    setDemo,
    signup,
    setSignup,
    prod,
    logout,
    recoveryPdf,
    setRecoveryPdf
  };

  return <AppContext.Provider value={value}> {children} </AppContext.Provider>
};

export { AppContextProvider };