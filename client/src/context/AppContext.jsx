import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { encrypt } from "../components/aesbox";

export const AppContext = createContext();

function AppContextProvider ({children}) {

  const backendUrl = import.meta.env.VITE_BACKEND;//Prod
  // const backendUrl = import.meta.env.VITE_LOCAL_BACKEND;//Develop

  const [isLoggedIn, setIsLoggedIn] = useState("N");
  const [authAccess, setAuthAccess] = useState(true);
  const [publicKey, setPublicKey] = useState(null);
  const [symKey, setSymKey] = useState(null);
  const [userServices, setUserServices] = useState([]);
  const [alias, setAlias] = useState("...");
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    axios.defaults.withCredentials = true;
    const timer = setTimeout(getAuthState, 2000);
    return () => clearTimeout(timer);
    }, [isLoggedIn]);


  const getAuthState = async () => {
    try {
      let token = localStorage.getItem("token");
      if (token) {
        axios.defaults.headers["Authorization"] = `Bearer ${token}`;
        let { data } = await axios.get(backendUrl + '/auth/is-auth');
        console.log(data.message);
        if (data.success) {
          setDemo(data.demo);
          setIsLoggedIn('T');
        }else(setIsLoggedIn('F'));
      }else{setIsLoggedIn('F');
      }
      }catch (error) {
      toast.error(error.message);
    }
  };

  const fetchServices = async () => {
  try {
    let cryptbsalt = encrypt(localStorage.getItem('bsalt'), publicKey);
    const { data } = await axios.post(`${backendUrl}/user/services`, {cryptbsalt});
    setUserServices(data.services || []);
    setAlias(data.alias || "Phoenix");
  } catch {
    setUserServices([]);
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
      console.log(`Seems authentication systems are down, Sir.`);
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
    symKey,
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
    setDemo
  };

  return <AppContext.Provider value={value}> {children} </AppContext.Provider>
};

export { AppContextProvider };