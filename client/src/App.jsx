import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Reframe from './components/addon.jsx';
import "react-toastify/dist/ReactToastify.css";

// Static Imports for instant transitions
import Home from "./pages/Home";
import Login from "./pages/Login";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import Faqs from "./pages/Faqs.jsx";
import Bifrost from "./pages/Bifrost.jsx";
import ContactUs from "./pages/Contact.jsx";

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Reframe />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/faqs" element={<Faqs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/bifrost" element={<Bifrost />} />
      </Routes>
    </div>
  );
};

export default App;