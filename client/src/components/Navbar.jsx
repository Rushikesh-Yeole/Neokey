import React, {useContext, useCallback} from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from '../context/AppContext';
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();
  const {isLoggedIn, setIsLoggedIn } = useContext(AppContext);
  
  
  const logout = useCallback(async () => {
    try {
      const email = localStorage.getItem("email");
      localStorage.clear();
      if (email) {
        localStorage.setItem("email", email);
      }
      setIsLoggedIn('N');
      navigate('/');
    }catch (error) {
      toast.error(error.message);
    }
  }, [setIsLoggedIn, navigate]);;

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
      <button className="z-10 flex justify-center ml-auto items-center px-4 py-1.5 sm:py-1 sm:mr-3 sm:px-5 mb-2 rounded-full border border-slate-300 bg-gray-800 shadow-lg text-cyan-300 group relative cursor-pointer glass-card">  
          <div className="z-10  ml-auto text-cyan-200 cursor-pointer group" >
          {<img src={assets.account} alt="Logo" className="w-6 sm:w-7 cursor-pointer" />}
          {<div className="absolute hidden group-hover:block top-1.5 text-black rounded pt-12 shadow-3xl">
            <ul className="list-none p-2 bg-cyan-200 text-sm rounded-xl glass-card">
            <li onClick={() => navigate('/bifrost')} className="py-1.5 px-1.5 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl ">Bifrost</li>
            <li onClick={() => navigate('/settings')} className="py-1.5 px-1.5 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl ">Settings</li>
            <li onClick={()=> {navigate('/reset')}} className="py-1.5 px-4 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">Reset</li>
            <li onClick={()=>{logout();navigate('/');}} className="py-1.5 px-4 m-2 flex justify-center shadow-md bg-gray-100 cursor-pointer rounded-full hover:shadow-xl">Logout</li>
            </ul>
          </div>}
        </div>
        </button>
        :
        <button onClick={() => navigate('/login')} className="mr-2 sm:mr-4 ml-auto mb-2 flex items-center sm:text-lg bg-cyan-200 border border-[#00f9ff] rounded-full px-4 py-1 sm:px-4 shadow-xl text-white hover:bg-cyan-200 hover:text-slate-800 glass-card">
          Login
        </button>}

      {/* Hamburger */}
      <button className="z-10 ml-2 sm:ml-0 flex justify-center items-center gap-2 px-4 py-1.5 sm:py-1.5 sm:px-6 mb-2 rounded-full border border-slate-300 bg-gray-800 shadow-xl text-cyan-300 group relative cursor-pointer glass-card">  
      {<img src={assets.menu} alt="Logo" className="w-6 cursor-pointer" />}
      {<div className="absolute hidden group-hover:block top-1 text-black rounded pt-12 mr-6 shadow-3xl">
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