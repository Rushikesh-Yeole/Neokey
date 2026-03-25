import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { assets } from '../assets/assets';

const getCachedStats = () => {
  try {
    let cached = localStorage.getItem('neokey_stats');
    if (cached) {
      return JSON.parse(cached);
    } else {
      return { users: 0, retrievals: 0, creations: 0, wau: 0, mau: 0 };
    }
  } catch (e) {
    console.log("error parsing local stats", e);
    return { users: 0, retrievals: 0, creations: 0, wau: 0, mau: 0 };
  }
};

const Stats = () => {
  const { backendUrl, isLoggedIn } = useContext(AppContext);
  const [stats, setStats] = useState(getCachedStats()); 

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${backendUrl}/admin/stats`);
      const data = res.data;
      if (data.success === false || data.userCount === undefined) {
        console.log("Viewing cached stats...", data.message || "Access Denied");
        return; 
      }
      
      const newStats = {  
        users: data.userCount || 0,
        retrievals: data.retrievals || 0,
        creations: data.creations || 0,
        wau: data.wau || 0,
        mau: data.mau || 0,
      };

      setStats(newStats);
      localStorage.setItem('neokey_stats', JSON.stringify(newStats));
    } catch (err) {
      console.error("fetch stats error:", err);
    }
  };
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (isLoggedIn === 'T') {
      fetchStats();
    }
    
    let intervalId;
    if (isLoggedIn === 'T') {
      intervalId = setInterval(fetchStats, 480000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  const renderStatCard = (label, value, index, pointer='') => {
    return (
      <div
        key={index}
        className="glass-card shadow-glass p-6 rounded-lg shadow-xl text-center w-full max-w-xs transition duration-300 hover:-translate-y-1 cursor-default"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-gray-400">{label}</h2>
        <p className="text-4xl font-bold text-white mt-2">{value}</p>
        {pointer && <p className="text-sm font-extralight text-gray-400">{pointer}</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-cyan-900 animate-pulse-smooth flex flex-col items-center justify-center px-14 pt-36 sm:pt-16 sm:px-0 select-none">
      <Navbar />
      
      <div className='sm:mt-auto mb-4 font-semibold w-full flex flex-col items-center'>
        <div className="flex items-center justify-center text-center text-gray-400 mb-3">
          <div className="mb-[-16px]">
            <img src={assets.analytics} alt="Logo" className="w-9 mb-11 cursor-pointer" />
          </div>
          <p className="align-baseline flex-nowrap text-base sm:text-3xl ml-2 mb-7 text-gray-400">Neokey stats in real-time</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mb-10 place-items-center">
          {renderStatCard('Total users', stats.users, 0)}
          {renderStatCard('Retrieved Passwords', stats.retrievals, 1)}
          {renderStatCard('Created Passwords', stats.creations, 2)}
          {renderStatCard('Weekly Active Users', `${stats.wau}+`, 3)}
          {renderStatCard('Monthly Active Users', `${stats.mau}+`, 4)}
        </div>
      </div>
      
      <div className="w-full mt-auto text-slate-400">
        <Footer />
      </div>
    </div>
  );
};

export default Stats;