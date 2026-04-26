import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from '../context/AppContext';
import { toast } from "react-toastify";
import axios from "axios";
import { arghash, symDecrypt, symEncrypt, hhash, localEncrypt } from "./aesbox";
import CredStore from "./CredStore";

const Navbar = () => {
  const navigate = useNavigate();
  const { backendUrl, isLoggedIn, setIsLoggedIn, demo, setDemo, prod, setSignup, logout, fetchServices } = useContext(AppContext);  
  
  const demoLogin = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/auth/demo`);
      
      if (data.success) {
        const blob = await symDecrypt(data.payload, import.meta.env.VITE_DEMO_SYM_KEY);

        let i = 0;
        const tokenLen = +blob.slice(i, i += 3);
        const token = blob.slice(i, i += tokenLen);
        const csaltLen = +blob.slice(i, i += 3);
        const csalt = blob.slice(i, i += csaltLen);

        localStorage.setItem("csalt", await symEncrypt(csalt, data.saltKey));
        const cred = await arghash("key", csalt);
        CredStore.setCsalt(csalt);
        CredStore.setSnkey(hhash("snkey", cred));
        CredStore.setCred(cred);
        setDemo(true);

        await fetchServices();
        setIsLoggedIn('T');
        const encToken = await localEncrypt(token);
        localStorage.setItem("token", encToken);
        axios.defaults.headers["Authorization"] = `Bearer ${token}`;
        toast.success(data.message, { autoClose: 1500 });
      } else {
        toast.error(data.message, { autoClose: 1200 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Demo login failed";
      toast.error(errorMessage, { autoClose: 1500 });
    }
  };

  return (
    <div className="w-full flex justify-between items-center p-4 sm:p-6 sm:px-18 sm:absolute fixed top-0 z-10 select-none backdrop-blur-md">
      <img onClick={() => navigate('/')} src={assets.logo} alt="Logo" className="left-5 w-12 mb-1 sm:w-26 mx-2 items-center cursor-pointer glow-logo" />
      <img onClick={() => navigate('/')} src={assets.beta} alt="Beta" className="hidden md:block w-10 mx-2 items-center cursor-pointer" />

      <a href="https://github.com/Rushikesh-Yeole/Neokey" target="_blank" rel="noopener noreferrer" className="hover:glow-logo">
        <img src={assets.github} alt="GitHub" className="w-10 mr-2 mb-0.5 cursor-pointer" />
      </a>
      
      {isLoggedIn === 'T' ? (
        <button className="z-10 flex justify-center ml-auto items-center px-4 py-1 sm:py-1 mr-4 sm:mr-6 sm:px-5 rounded-full border border-slate-300 bg-gray-800 shadow-lg text-cyan-300 group relative cursor-pointer glass-card">  
          <div className="z-10 ml-auto text-cyan-200 cursor-pointer group">
            <img src={demo ? assets.demo : assets.account} alt="Account" className="w-6 sm:w-7 cursor-pointer border-[#00f9ff]" />
            <div className="absolute hidden group-hover:block top-1.5 left-1/2 -translate-x-1/4 text-black rounded pt-12 shadow-3xl">
              <ul className="list-none p-2 bg-cyan-200 text-sm rounded-xl glass-card">
                <li onClick={() => navigate('/bifrost')} className="py-1.5 px-1.5 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">Bifrost</li>
                <li onClick={() => navigate('/settings')} className="py-1.5 px-1.5 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">Settings</li>
                <li onClick={() => { logout(); navigate('/'); }} className="py-1.5 px-4 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">Logout</li>
              </ul>
            </div>
          </div>
        </button>
      ) : (
        <>
          <button onClick={() => demoLogin()} className="mr-2 sm:mr-4 ml-auto flex items-center text-sm sm:text-lg bg-cyan-200 border border-[#00f9ff] rounded-full px-3 py-1.5 sm:px-4 shadow-xl text-white hover:bg-cyan-200 hover:text-slate-800 glass-card">
            Demo
          </button>
          <button onClick={() => { setSignup(false); navigate('/login'); }} className="mr-2 sm:mr-4 flex items-center text-sm sm:text-lg bg-cyan-200 border border-[#00f9ff] rounded-full px-3 py-1.5 sm:px-4 shadow-xl text-white hover:bg-cyan-200 hover:text-slate-800 glass-card">
            Login
          </button>
        </>
      )}

      <button className="z-10 ml-0.5 sm:ml-0 flex justify-center items-center gap-2 px-4 py-1 sm:py-1.5 sm:px-6 rounded-full border border-slate-300 bg-gray-800 shadow-xl text-cyan-300 group relative cursor-pointer glass-card">  
        <img src={assets.menu} alt="Menu" className="w-6 sm:w-6 cursor-pointer" />
        <div className="absolute hidden group-hover:block top-1 left-1/4 -translate-x-1/2 text-black rounded pt-12 shadow-3xl">
          <ul className="list-none p-2 bg-cyan-200 text-sm rounded-xl glass-card">
            {isLoggedIn !== 'T' && <li onClick={() => navigate('/bifrost')} className="py-1.5 px-4 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">BIFROST</li>}
            {!prod && <li onClick={() => navigate('/stats')} className="py-1.5 px-4 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">Stats</li>}
            <li onClick={() => navigate('/faqs')} className="py-1.5 px-1.5 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">FAQs</li>
            <li onClick={() => navigate('/contact')} className="py-1.5 px-1.5 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">Contact</li>
          </ul>
        </div>
      </button>

      <div className="p-1 elegant-wave z-0" style={{ width: '100%', height: "12px", marginTop: '5px' }}></div>
    </div>
  );
};

export default React.memo(Navbar);