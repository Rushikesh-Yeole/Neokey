import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {

  const backendUrl = "https://neokeybts.onrender.com";//Prod
  // const backendUrl = import.meta.env.VITE_BACKEND_URL;//Develop

  const [isLoggedIn, setIsLoggedIn] = useState("N");
  const [publicKey, setPublicKey] = useState(null);

  useEffect(() => {
    axios.defaults.withCredentials = true;
    if(isLoggedIn ==='N'){getAuthState()};
  }, [isLoggedIn]);


  const getAuthState = async () => {
    try {
      let token = localStorage.getItem("token");
      if (token) {
        axios.defaults.headers["Authorization"] = `Bearer ${token}`;
        let { data } = await axios.get(backendUrl + '/auth/is-auth');
        console.log(data.message);
        if (data.success) {
          setIsLoggedIn('T');
        }else(setIsLoggedIn('F'));
      }else{setIsLoggedIn('F');
      }
      }catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!publicKey) {
      warm();
      fetchPublicKey();
    }
  }, [publicKey]);
  
  const warm = async () => {
    let response = await axios.head(`${backendUrl}/user/services`);
    if(response.status===200){console.log(`All systems are a go, Sir.`)}else{console.log(`Seems the systems are down, Sir.`)}
  }

  const fetchPublicKey = async () => {
    try {
      let response = await axios.get(backendUrl + '/user/public-key');
      if(response.data.publicKey){console.log(`Comms are fully operational.`)}else{console.log(`No PublicKey`)};
      setPublicKey(response.data.publicKey);
    } catch (error) {
      console.error("Error fetching public key", error);
    }
  };  
  
  const value = {
    publicKey,
    backendUrl,
    isLoggedIn,
    setIsLoggedIn
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};
