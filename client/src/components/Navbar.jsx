import React, {useContext, useCallback} from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from '../context/AppContext';
import { toast } from "react-toastify";
import axios from "axios";
import { symDecrypt } from "./aesbox";

const Navbar = () => {
  const navigate = useNavigate();
  const { backendUrl, isLoggedIn, setIsLoggedIn, symKey, setDemo, publicKey} = useContext(AppContext);  
  
  const logout = useCallback(async () => {
    try {
      localStorage.clear();
      setDemo(false);
      setIsLoggedIn('N');
      navigate('/');
    }catch (error) {
      toast.error(error.message);
    }
  }, [setIsLoggedIn, navigate]);;

  const demoLogin = async () =>{
    try {
    let { data } = await axios.get(backendUrl + '/auth/demo');
    if (data.success){
      const blob = await symDecrypt(data.payload, '000');

      const tokenLen = +blob.slice(0,3);
      const token = blob.slice(3, 3 + tokenLen);
      const csaltLen = +blob.slice(3 + tokenLen, 6 + tokenLen);
      const csalt = blob.slice(6 + tokenLen, 6 + tokenLen + csaltLen);
      const bsalt = blob.slice(6 + tokenLen + csaltLen);

      localStorage.setItem("token", token);
      localStorage.setItem("csalt", csalt);
      localStorage.setItem("bsalt", bsalt);

      setIsLoggedIn('T');
      axios.defaults.headers["Authorization"] = `Bearer ${token}`;
      toast.success(data.message, {autoClose: 1500});
    } else {toast.error(data.message,{ autoClose: 1200});}
    } catch (error) {
    toast.error(error.message,{ autoClose: 1500});
    }
  }

  return (
      <div className="w-full flex justify-between items-center p-4 sm:p-6 sm:px-18 sm:absolute fixed top-0 z-10 select-none glass-card">
      {<img onClick={() => navigate('/')}src={assets.logo} alt="Logo" className="left-5 w-16 sm:w-26 mx-2 items-center cursor-pointer glow-logo" />}
      {<img src={assets.beta} alt="Logo" className="w-10 mx-2 items-center cursor-pointer " />}

      {/* <div className="ml-auto flex items-center gap-4">
      <a href="https://github.com/Rushikesh-Yeole" target="_blank" rel="noopener noreferrer">
      {<img src={assets.github} alt="Logo" className="w-14 mb-2.5  cursor-pointer" />}
      </a>
      </div> */}
      {/* <div className="block md:hidden ml-auto px-2">
      <InstallButton />
      </div> */}
      
      {isLoggedIn==='T' ?
      <button className="z-10 flex justify-center ml-auto items-center px-4 py-1.5 sm:py-1 mr-4 sm:mr-3 sm:px-5 mb-2 rounded-full border border-slate-300 bg-gray-800 shadow-lg text-cyan-300 group relative cursor-pointer glass-card">  
          <div className="z-10  ml-auto text-cyan-200 cursor-pointer group" >
          {<img src={assets.account} alt="Logo" className="w-4 sm:w-7 cursor-pointer" />}
          {<div className="absolute hidden group-hover:block top-1.5 left-1/2 -translate-x-1/4 text-black rounded pt-12 shadow-3xl">
            <ul className="list-none p-2 bg-cyan-200 text-sm rounded-xl glass-card">
            <li onClick={() => navigate('/bifrost')} className="py-1.5 px-1.5 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl ">Bifrost</li>
            <li onClick={() => navigate('/settings')} className="py-1.5 px-1.5 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl ">Settings</li>
            {/* <li onClick={()=> {navigate('/reset')}} className="py-1.5 px-4 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">Reset</li> */}
            <li onClick={()=>{logout();navigate('/');}} className="py-1.5 px-4 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">Logout</li>
            </ul>
          </div>}
        </div>
        </button>
        :(
        <>
        <button onClick={() => demoLogin()} className="mr-2 sm:mr-4 ml-auto mb-2 flex items-center text-sm sm:text-lg bg-cyan-200 border border-[#00f9ff] rounded-full px-2 py-1 sm:px-4 shadow-xl text-white hover:bg-cyan-200 hover:text-slate-800 glass-card">
          Demo
        </button>
        <button onClick={() => navigate('/login')} className="mr-2 sm:mr-4 mb-2 flex items-center text-sm sm:text-lg bg-cyan-200 border border-[#00f9ff] rounded-full px-2 py-1 sm:px-4 shadow-xl text-white hover:bg-cyan-200 hover:text-slate-800 glass-card">
          Login
        </button>
        </>)
        }

      {/* Hamburger */}
      <button className="z-10 ml-0.5 sm:ml-0 flex justify-center items-center gap-2 px-4 py-1.5 sm:py-1.5 sm:px-6 mb-2 rounded-full border border-slate-300 bg-gray-800 shadow-xl text-cyan-300 group relative cursor-pointer glass-card">  
      {<img src={assets.menu} alt="Logo" className="w-4 sm:w-6 cursor-pointer" />}
      {<div className="absolute hidden group-hover:block top-1 left-1/4 -translate-x-1/2 text-black rounded pt-12 shadow-3xl">
            <ul className="list-none p-2 bg-cyan-200 text-sm rounded-xl glass-card">
            {isLoggedIn!=='T' && <li onClick={()=>navigate('/bifrost')} className="py-1.5 px-4 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">BIFROST</li>}
            {/* <li onClick={() => navigate('/stats')} className="py-1.5 px-4 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl ">Stats</li> */}
            <li onClick={() => navigate('/faqs')} className="py-1.5 px-1.5 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl ">FAQs</li>
            <li onClick={() => navigate('/contact')} className="py-1.5 px-1.5 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl ">Contact</li>
            </ul>
          </div>}
      </button>

      <div className="p-1 elegant-wave z-0" style={{ width: '100%', height: "12px", marginTop: '5px' }}></div>
    </div>
  );
};

export default React.memo(Navbar);