import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Reframe from './components/addon.jsx';
import "react-toastify/dist/ReactToastify.css";
import { lazy } from "react";

const Home = lazy(() => import("./pages/Home"));
import Login from "./pages/Login";
import Reset from "./pages/Reset";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import Info from "./pages/fats";
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
        <Route path="/reset" element={<Reset />} />
        <Route path="/stts" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/fats" element={<Info />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/bifrost" element={<Bifrost />} />
      </Routes>
    </div>
  );
};

export default App;
