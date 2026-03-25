import { useState, useEffect, useContext } from 'react';
import { Trash2, Key, Shield, Share2, User, ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { encrypt, hhash, arghash } from '../components/aesbox';
import CredStore from '../components/CredStore';
import posthog from 'posthog-js';

// Configuration
const MENU_ITEMS = [
  { id: 'services', label: 'Manage Services', icon: Key, description: 'Remove saved services' },
  { id: 'account', label: 'Account', icon: Shield, description: 'Info & Privacy' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Password & authentication' },
  { id: 'notifications', label: 'Coming soon ...', icon: Share2, description: '' },
];

// Manage Services Panel
const ServicesPanel = ({ isMobile }) => {
  const { backendUrl, userServices, demo, publicKey, fetchServices } = useContext(AppContext);
  const [servicesToDelete, setServicesToDelete] = useState([]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const hasChanges = servicesToDelete.length > 0;

  const toggleDeletion = (service) => {
    setServicesToDelete(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    if (demo) return toast.info("Can't alter Demo account settings.", { autoClose: 2000 });

    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const csalt = CredStore.getCsalt();
      const cred = await arghash(password, csalt);
      const cred_hash = hhash("cred", cred);

      const sigKey = hhash("sigkey", cred )
      const signsToDelete = servicesToDelete.map(svc => hhash(svc.toLowerCase(), sigKey));

      const payload = {
        services: signsToDelete, 
        cryptcred: encrypt(cred_hash, publicKey)
      };

      const { data } = await axios.post(`${backendUrl}/user/delServices`, payload);
      
      if (data.success) {
        fetchServices();
        setServicesToDelete([]);
        toast.success(data.message, { autoClose: 1500 });
      } else {
        toast.error(data.message, { autoClose: 1500 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Operation failed.";
      toast.error(errorMessage, { autoClose: 1500 });
    } finally {
      setPassword("");
      setLoading(false);
    }
  };

  return (
    <div className={`h-full flex flex-col ${isMobile ? 'fixed top-4 left-4 right-4 z-50' : ''}`}>
      {hasChanges && (
        <div className="flex gap-3 justify-end mb-4 animate-fade-in">
          <div className="flex items-center gap-3 w-full px-4 py-1 rounded-full text-black bg-slate-100">
            <Key size={16} />
            <input
              onChange={(e) => setPassword(e.target.value.trim())}
              value={password}
              className="px-2 bg-transparent outline-none w-full"
              type="new-password"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              style={{ WebkitTextSecurity: "disc" }}
              placeholder="Enter Neokey to save changes"
            />
          </div>
          <button
            onClick={password ? handleSave : undefined}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all ${
              loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-slate-700 hover:bg-cyan-900 text-white shadow-lg hover:scale-105'
            }`}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${isMobile && hasChanges ? 'pt-4' : ''}`}>
        <h2 className="text-2xl font-bold text-white mb-2">Manage Services</h2>
        <p className="text-gray-400 mb-6">Remove passwords you no longer use</p>

        {userServices.length === 0 ? (
          <div className="text-center py-12">
            <Key size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Seems you have no services</p>
          </div>
        ) : (
          <div className="space-y-2 mb-36">
            {userServices.map((service) => {
              const isMarked = servicesToDelete.includes(service);
              return (
                <div key={service} className={`flex items-center justify-between p-4 max-w-[95%] rounded-xl transition-all border backdrop-blur-sm ${
                  isMarked ? 'bg-red-900/30 border-red-500/50 opacity-60' : 'bg-slate-800/10 hover:bg-slate-700/50 border-slate-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      isMarked ? 'bg-red-600/20 text-red-400' : 'bg-cyan-600/20 text-cyan-400'
                    }`}>{service.charAt(0).toUpperCase()}</div>
                    <span className={`font-medium ${isMarked ? 'text-red-400 line-through' : 'text-white'}`}>{service}</span>
                  </div>
                  <button onClick={() => toggleDeletion(service)} className={`p-2 rounded-full transition-all ${
                    isMarked ? 'bg-red-600/20 text-red-400' : 'text-gray-400 hover:text-red-400 hover:bg-red-600/10'
                  }`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// subComp - Account Panel
const AccountPanel = ({ isMobile }) => {
  const { backendUrl, publicKey, demo, setIsLoggedIn, setDemo, alias, userServices } = useContext(AppContext);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const delAccount = async () => {
    if (!password) return toast.error("Enter master password");
    if (demo) return toast.info("Can't alter Demo account settings. Please Sign in");

    setLoading(true);
    try {
      const csalt = CredStore.getCsalt();
      await new Promise(r => setTimeout(r, 1000));
      const cred = await arghash(password, csalt);
      const cred_hash = hhash("cred", cred);
      const cryptcred = encrypt(cred_hash, publicKey);
      const { data } = await axios.post(`${backendUrl}/user/delAccount`, { cryptcred });

      if (data.success) {
        posthog.capture('account_deleted');
        localStorage.clear();
        setDemo(false);
        setIsLoggedIn('N');
        navigate('/');
        toast.success(data.message, { autoClose: 5000 });
      } else {
        toast.error(data.message, { autoClose: 2000 });
      }
    } catch (error) {
      console.error("Delete account failed:", error);
      const errorMessage = error.response?.data?.message || "Operation failed.";
      toast.error(errorMessage, { autoClose: 1500 });
    } finally {
      setPassword("");
      setLoading(false);
      setShowDeletePopup(false);
    }
  };
  
  const InfoItem = ({ icon: Icon, label, value, type }) => (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-700/20 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-cyan-600/20 flex items-center justify-center"><Icon size={18} className="text-cyan-400" /></div>
        <div className="font-medium text-white">{label}</div>
      </div>
      <div className="flex items-center gap-3">
        {type === 'status' ? (
          <><div className="w-2 h-2 rounded-full bg-green-400"></div><span className="text-green-400 font-medium">{value}</span></>
        ) : type === 'number' ? (
          <div className="px-3 py-1 rounded-full bg-cyan-600/20 text-cyan-400 font-semibold">{value}</div>
        ) : <span className="text-gray-300 font-medium">{value}</span>}
      </div>
    </div>
  );

  return (
    <div className={`h-full flex flex-col ${isMobile ? 'fixed top-4 left-4 right-4 z-50' : ''}`}>
      <div className="flex-1 overflow-y-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Account Settings</h2>
          <p className="text-yellow-300 mt-1">Mutable aliases & secure passwords sharing coming soon!</p>
        </div>

        <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/30"><h3 className="text-lg font-semibold text-white">Account Information</h3></div>
          <div className="divide-y divide-slate-700/30">
            <InfoItem icon={User} label="Alias" value={alias} type="text" />
          </div>
        </div>

        <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/30"><h3 className="text-lg font-semibold text-white">Usage Statistics</h3></div>
          <div className="divide-y divide-slate-700/30">
            <InfoItem icon={Key} label="Total Services" value={userServices.length} type="number" />
            <InfoItem icon={Shield} label="Account Status" value="Active" type="status" />
          </div>
        </div>

        <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden p-6">
          <button onClick={() => setShowDeletePopup(true)} className="w-full flex items-center justify-between p-4 rounded-xl border bg-red-900/20 hover:bg-red-900/30 border-red-500/30 group transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-600/20 text-red-400"><Trash2 size={18} /></div>
              <div className="text-left"><div className="font-medium text-red-400">Delete Account</div><div className="text-sm text-red-400/70">Permanently delete your account</div></div>
            </div>
            <div className="text-red-400/70 group-hover:text-red-400">→</div>
          </button>
        </div>
      </div>
      
      {showDeletePopup && (
        <div className="absolute inset-0 bg-cyan-600/10 backdrop-blur-3xl transition-all duration-500 flex justify-center items-center z-50">
          <div className="shadow-2xl bg-red-600/50 border-red-500/10 p-6 font-medium rounded-2xl text-white max-w-[90%]">
            <h3 className="text-xl text-white font-bold mb-4">
              Confirm account deletion
            </h3>
            <p className="sm:text-base text-xs mb-6">
              You will permanently loose all your passwords.
              <br/>
              You will have to create a new account to use Neokey.
            </p>
            <div className="flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-white/10">
              <Key size={16} />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="new-password"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                required
                className="bg-transparent outline-none w-full text-white"
                placeholder="Enter master password"
              />
            </div>
            <div className="flex justify-between">
              <button
                className="w-full mx-2 p-2 rounded-full bg-black/50 text-white disabled:opacity-60"
                disabled={!password || loading}
                onClick={delAccount}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
              <button
                className="w-full mx-2 rounded-full bg-white text-black"
                onClick={() => {
                  setShowDeletePopup(false);
                  setPassword("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PlaceholderPanel = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center mb-4">
      <SettingsIcon size={24} className="text-white" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
    <p className="text-gray-400">This feature is coming soon!</p>
  </div>
);

// Main
const Settings = () => {
  const [activeSubmenu, setActiveSubmenu] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const { isLoggedIn, demo } = useContext(AppContext);

  useEffect(() => {
    if (isLoggedIn === 'T' && !CredStore.getSnkey() && !demo) navigate('/');
  }, [isLoggedIn, demo, navigate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { 
    if (!isMobile && !activeSubmenu) setActiveSubmenu('services'); 
  }, [isMobile, activeSubmenu]);

  const renderContent = () => {
    switch (activeSubmenu) {
      case 'services': return <ServicesPanel isMobile={isMobile} />;
      case 'account': return <AccountPanel isMobile={isMobile} />;
      default: return <PlaceholderPanel title={MENU_ITEMS.find(i => i.id === activeSubmenu)?.label || 'Settings'} />;
    }
  };

  // Mobile render
  if (isMobile) {
    return (
      <div className="min-h-screen bg-cyan-950">
        <div className="bg-slate-900/10 backdrop-blur-md border-b border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-slate-800/50" onClick={() => activeSubmenu ? setActiveSubmenu('') : navigate('/')}>
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Settings</h1>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {!activeSubmenu ? MENU_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setActiveSubmenu(item.id)} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-700/50 border border-slate-700/70 backdrop-blur-sm transition-all">
              <item.icon size={20} className="text-cyan-400" />
              <div className="text-left"><div className="font-medium text-white">{item.label}</div><div className="text-sm text-gray-400">{item.description}</div></div>
            </button>
          )) : (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 min-h-screen">
              {renderContent()}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop render
  return (
    <div className="min-h-screen bg-cyan-950 p-6">
      <div className="mt-6 max-w-8xl mx-auto bg-slate-900/20 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
        <div className="flex h-[80vh]">
          <div className="w-80 backdrop-blur-md border-r border-slate-700/50 flex flex-col">
            <div className="p-6 border-b border-slate-700/50">
              <h1 className="text-2xl font-bold text-cyan-100 flex items-center gap-3"><SettingsIcon size={24} className="text-cyan-400" /> Settings</h1>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {MENU_ITEMS.map((item) => (
                <button key={item.id} onClick={() => setActiveSubmenu(item.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl text-left border transition-all ${activeSubmenu === item.id ? 'bg-cyan-600/20 border-cyan-500/20 shadow-lg' : 'border-transparent hover:bg-slate-800/30'}`}>
                  <item.icon size={20} className={activeSubmenu === item.id ? 'text-cyan-400' : 'text-gray-400'} />
                  <div><div className={`font-medium ${activeSubmenu === item.id ? 'text-white' : 'text-gray-300'}`}>{item.label}</div><div className="text-sm text-gray-400">{item.description}</div></div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 p-8 overflow-hidden">{renderContent()}</div>
        </div>
      </div>
      <div className="fixed w-full mt-10 text-slate-400"><Footer /></div>
    </div>
  );
};

export default Settings;