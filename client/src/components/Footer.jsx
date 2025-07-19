import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

return(
<footer className="flex justify-between items-center text-center py-4 border-t border-gray-300 cursor-none">
  <div className="flex justify-center flex-grow">
  {/* <p className="text-gray-200 text-xs">Copyright © 2025 NeoKey™ | All Rights Reserved | Patent Pending.</p> */}
  <p className="text-gray-200 text-xs"> 2025 NeoKey </p>
  </div>  
  <div className="flex items-center">  
  {/* <img src={assets.fats} alt="" className="w-6 h-6 mr-4" /> */}
  </div>  
</footer>
  );
};

export default Footer;
