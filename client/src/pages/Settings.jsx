import { useState, useEffect, useContext } from 'react';
import { Trash2, Save, ArrowLeft, Settings as SettingsIcon, Shield, Key, User, Bell, Palette, Info, RefreshCcw  } from 'lucide-react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { encrypt, bhash } from '../components/aesbox';

const Settings = () => {
  const { backendUrl, userServices, setUserServices, alias, demo, publicKey } = useContext(AppContext);
  const [activeSubmenu, setActiveSubmenu] = useState('');
  const [servicesToDelete, setServicesToDelete] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const settingsMenu = [
    { id: 'services', label: 'Manage Services', icon: Key, description: 'Remove saved services' },
    { id: 'account', label: 'Account', icon: Shield, description: 'Info & Privacy' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Password & authentication' },
    // { id: 'account', label: 'Account', icon: User, description: 'Profile and account settings' },
    { id: 'notifications', label: 'Coming soon ...', icon: RefreshCcw , description: '' },
    // { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme and display options' },
    // { id: 'about', label: 'About', icon: Info, description: 'App information and support' }
  ];

  const toggleServiceForDeletion = (service) => {
    setServicesToDelete(prev => {
      const newList = prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service];
      setHasChanges(newList.length > 0);
      return newList;
    });
  };

  const handleSave = async () => {
    if (servicesToDelete.length === 0) return;
    
    setLoading(true);
    try {
      if(demo){toast.info("Can't alter Demo account settings. Please Sign in",{ autoClose: 2000}); return}
      await new Promise(resolve => setTimeout(resolve, 100));
      let cryptcred =  encrypt(bhash(password, localStorage.getItem("csalt")), publicKey);
      let cryptbsalt =  encrypt(localStorage.getItem("bsalt"), publicKey);

      let {data} = await axios.post(`${backendUrl}/user/delServices`, {services: servicesToDelete, cryptcred, cryptbsalt });
      if (data.success) { 
      setUserServices(data.services);
      toast.success(data.message,{ autoClose: 1500});
      setHasChanges(false);
      } else {
        toast.error(data.message,{ autoClose: 1500});
      }
    } catch (error) {
      console.error('Failed to delete services:', error);
    } finally {
      setPassword("")
      setLoading(false);
    }
  };

  const renderServicesContent = () => (
    <div className={`h-full flex flex-col ${isMobile && 'fixed top-4 left-4 right-4 z-50'}`}>
      {hasChanges && (
        <form className={`flex gap-3 justify-end mb-4`}>
          
            {/* <Save size={16} /> */}
            <div className="flex items-center gap-3 w-full px-4 py-1 rounded-full text-black bg-slate-100">        
              <Key size={16} />
              <input
                onChange={(e) => setPassword(e.target.value.trim())}
                value={password}
                className="px-2 bg-transparent outline-none w-full"
                type="new-password"
                style={{ WebkitTextSecurity: "disc" }}
                placeholder="Enter Neokey to save changes"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                required
              />
              </div>
          <button
            onClick={password? handleSave:null}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
              loading 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-slate-700 hover:bg-cyan-900 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
          {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}
      
      <div className={`flex-1 overflow-y-auto ${isMobile & hasChanges && 'pt-4'}`}>
        <h2 className="text-2xl font-bold text-white mb-2">Manage Services</h2>
        <p className="text-gray-400 mb-6">Remove services you no longer need, permanently.</p>
        
        {userServices.length === 0 ? (
          <div className="text-center py-12">
            <Key size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Seems you have no services</p>
          </div>
        ) : (
          <div className="space-y-2 mb-36">
            {userServices.map((service, index) => {
              const isMarkedForDeletion = servicesToDelete.includes(service);
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 max-w-[95%] rounded-xl transition-all duration-300 ${
                    isMarkedForDeletion 
                      ? 'bg-red-900/30 border-red-500/50 opacity-60' 
                      : 'bg-slate-800/10 hover:bg-slate-700/50 border-slate-700'
                  } border backdrop-blur-sm`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      isMarkedForDeletion ? 'bg-red-600/20 text-red-400' : 'bg-cyan-600/20 text-cyan-400'
                    }`}>
                      {service.charAt(0).toUpperCase()}
                    </div>
                    <span className={`font-medium ${isMarkedForDeletion ? 'text-red-400 line-through' : 'text-white'}`}>
                      {service}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleServiceForDeletion(service)}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      isMarkedForDeletion
                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                        : 'text-gray-400 hover:text-red-400 hover:bg-red-600/10'
                    }`}
                  >
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

  const renderAccountContent = () => {

  const handleDeleteAccount = () => {toast.info("Feature coming soon.", { autoClose: 3000 });};
  
  const InfoItem = ({ icon: Icon, label, value, type }) => (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-700/20 transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-cyan-600/20 flex items-center justify-center">
          <Icon size={18} className="text-cyan-400" />
        </div>
        <div className="font-medium text-white">{label}</div>
      </div>
      <div className="flex items-center gap-3">
        {type === 'status' ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-green-400 font-medium">{value}</span>
          </div>
        ) : type === 'number' ? (
          <div className="px-3 py-1 rounded-full bg-cyan-600/20 text-cyan-400 font-semibold">
            {value}
          </div>
        ) : (
          <span className="text-gray-300 font-medium">{value}</span>
        )}
      </div>
    </div>
  );

  const ActionButton = ({ onClick, icon: Icon, title, description, variant = 'default' }) => {
    const styles = variant === 'danger' 
      ? "bg-red-900/20 hover:bg-red-900/30 border-red-500/30"
      : "bg-slate-700/30 hover:bg-slate-700/50 border-slate-600/50";
    
    const iconStyles = variant === 'danger' 
      ? "bg-red-600/20 text-red-400"
      : "bg-blue-600/20 text-blue-400";
    
    const textStyles = variant === 'danger' 
      ? "text-red-400"
      : "text-white";

    const descStyles = variant === 'danger' 
      ? "text-red-400/70"
      : "text-gray-400";

    const arrowStyles = variant === 'danger' 
      ? "text-red-400/70 group-hover:text-red-400"
      : "text-gray-400 group-hover:text-white";

    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group ${styles}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconStyles}`}>
            <Icon size={18} />
          </div>
          <div className="text-left">
            <div className={`font-medium ${textStyles}`}>{title}</div>
            <div className={`text-sm ${descStyles}`}>{description}</div>
          </div>
        </div>
        <div className={`transition-colors ${arrowStyles}`}>→</div>
      </button>
    );
  };

  const Section = ({ title, children }) => (
    <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/30">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  // return{}
  return (
    <div className={`h-full flex flex-col ${isMobile && 'fixed top-4 left-4 right-4 z-50'}`}>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Account Settings</h2>
            {/* <p className="text-gray-400">Manage your account information and privacy</p> */}
            <p className="text-yellow-300">Mutable aliases & seamless passwords sharing coming soon!  </p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {/* Account Information */}
          <Section title="Account Information">
            <div className="divide-y divide-slate-700/30">
              <InfoItem icon={User} label="Alias" value={alias} type="text" />
              {/* <InfoItem 
                icon={Info} 
                label="Member Since" 
                value={new Date(accountData.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })} 
                type="text" 
              /> */}
              {/* <InfoItem icon={Shield} label="Last Login" value={accountData.lastLogin} type="text" /> */}
            </div>
          </Section>

          {/* Usage Statistics */}
          <Section title="Usage Statistics">
            <div className="divide-y divide-slate-700/30">
              <InfoItem icon={Key} label="Total Services" value={userServices.length} type="number" />
              <InfoItem icon={Shield} label="Account Status" value="Active" type="status" />
            </div>
          </Section>

          {/* Data & Privacy */}
          <Section title="Data & Privacy">
            <div className="p-6 space-y-4">
              <ActionButton 
                onClick={handleDeleteAccount}
                icon={Trash2}
                title="Delete Account"
                description="Permanently delete your account"
                variant="danger"
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

  const renderComingSoon = (title) => (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4">
        <SettingsIcon size={24} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400">This feature is coming soon!</p>
    </div>
  );

  const renderContent = () => {
    switch (activeSubmenu) {
      case 'services':
        return renderServicesContent();
      case 'security':
        return renderComingSoon('Security Settings');
      case 'account':
        return renderAccountContent();
      case 'notifications':
        return renderComingSoon('More settings');
      case 'appearance':
        return renderComingSoon('Appearance Settings');
      case 'about':
        return renderComingSoon('About Neokey');
      // default:
      //   return renderServicesContent();
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-cyan-900 to-cyan-950">
        <div className="bg-slate-900/10 backdrop-blur-md border-b border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-slate-800/50 " onClick={()=> activeSubmenu? setActiveSubmenu('') : navigate('/')}>
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Settings</h1>
          </div>
        </div>
        
        <div className="p-4 space-y-2">
          {!activeSubmenu && settingsMenu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {setActiveSubmenu(item.id);setHasChanges(false);setServicesToDelete([])}}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                  activeSubmenu === item.id
                    ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/50'
                    : ' hover:bg-slate-700/50'
                } border border-slate-700/70 backdrop-blur-sm`}
              >
                <Icon size={20} className="text-cyan-400" />
                <div className="text-left">
                  <div className="font-medium text-white">{item.label}</div>
                  <div className="text-sm text-gray-400">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="p-4">
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 min-h-screen">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-cyan-900 to-cyan-950 p-6">
      <div className="mt-6 max-w-8xl mx-auto">
        <div className="bg-slate-900/20 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
          <div className="flex h-[80vh]">
            {/* Left Sidebar */}
            <div className="w-80 backdrop-blur-md border-r border-slate-700/50 flex flex-col">
              <div className="p-6 border-b border-slate-700/50">
                <h1 className="text-2xl font-bold text-cyan-100 flex items-center gap-3">
                  <SettingsIcon size={24} className="text-cyan-400" />
                  Settings
                </h1>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {settingsMenu.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {setActiveSubmenu(item.id);setHasChanges(false);setServicesToDelete([])}}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left ${
                        activeSubmenu === item.id
                          ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/50 shadow-lg'
                          : 'border-transparent'
                      } border backdrop-blur-sm`}
                    >
                      <Icon size={20} className={activeSubmenu === item.id ? 'text-cyan-400' : 'text-gray-400'} />
                      <div>
                        <div className={`font-medium ${activeSubmenu === item.id ? 'text-white' : 'text-gray-300'}`}>
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-400">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Right Content */}
            <div className="flex-1 p-8 overflow-hidden">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
        <div className="fixed w-full mt-16 text-slate-400">
          <Footer />
        </div>
    </div>
  );
};

export default Settings;