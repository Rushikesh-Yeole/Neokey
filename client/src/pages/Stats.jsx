import React, { useEffect, useState, useRef, useContext, useCallback } from 'react';
import axios from 'axios';
import { AppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { assets } from '../assets/assets';

const Stats = () => {
  const { backendUrl} = useContext(AppContext);
  const statCardsRef = useRef([]);
  
  const getLocalStorageValue = (key, defaultValue = 0) => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? defaultValue);
    } catch {
      localStorage.removeItem(key);
      return defaultValue;
    }
  };

  const [stats, setStats] = useState({
    users: getLocalStorageValue('users'),
    retrievals: getLocalStorageValue('retrievals'),
    creations: getLocalStorageValue('creations'),
    engagement: getLocalStorageValue('engagement'),
    wau: getLocalStorageValue('wau'),
    mau: getLocalStorageValue('mau'),
  });

  const fetchStats = async () => {
    try {
      const {
        data: {
          userCount,
          retrievals = 0,
          creations = 0,
          engagementTrends = {},
          wau = 0,
          mau = 0,
        },
      } = await axios.get(`${backendUrl}/admin/stats`);
  
      const engagement = Object
        .values(engagementTrends)
        .reduce(
          (sum, { login = 0, reset = 0, bifrost = 0 }) =>
            sum + login + reset + bifrost,
          0
        );
  
      const statsObj = {
        users:       userCount,
        retrievals,
        creations,
        engagement,
        wau,
        mau,
      };
  
      setStats(statsObj);
      Object.entries(statsObj).forEach(
        ([key, val]) => localStorage.setItem(key, JSON.stringify(val))
      );
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchStats();
    const intervalId = setInterval(fetchStats, 480000);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate__fadeInUp');
          }
        });
      },
      { threshold: 0.5 }
    );

    statCardsRef.current.forEach((card) => observer.observe(card));
    
    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    };
  }, []);

  const renderStatCard = useCallback((label, value, index, pointer='') => (
    <div
      key={index}
      ref={(el) => (statCardsRef.current[index] = el)}
      className="glass-card shadow-glass p-6 rounded-lg shadow-xl text-center w-full max-w-xs transform transition-all duration-700 ease-out hover:scale-105 hover:translate-y-2 animate__animated"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-gray-400">{label}</h2>
      <p className="text-4xl font-bold text-white mt-2">{value}</p>
      <p className="text-sm font-extralight text-gray-400">{pointer}</p>
    </div>
  ), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-cyan-900 animate-pulse-smooth flex flex-col items-center justify-center px-14 pt-36 sm:pt-16 sm:px-0 select-none">
      <Navbar />
      <div className='sm:mt-36 mb-4 font-semibold'>
      <div className="flex items-center justify-center text-center text-gray-400 mb-3">
      <div className="mb-[-16px]">
      {<img src={assets.analytics} alt="Logo" className="w-9 mb-11 cursor-pointer" />}
      </div>
      <p className="align-baseline flex-nowrap text-sm sm:text-3xl mb-7 text-gray-400">Neokey stats in real-time.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-10xl mb-10">
        {renderStatCard('Total users', `${stats.users}+`, 0)}
        {renderStatCard('Retrieved Passwords', stats.retrievals, 1)}
        {renderStatCard('Created Passwords', stats.creations, 2)}
        {/* {renderStatCard('90-Day User Engagement', stats.engagement, 3, 'Actions across platform')} */}
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