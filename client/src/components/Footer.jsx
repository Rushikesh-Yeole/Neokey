import { assets } from "../assets/assets";

const Footer = () => {
return(
<footer className="w-full flex justify-between items-center text-center py-2 text-inherit border-t border-[currentColor]">
  <div className="flex justify-center flex-grow items-center">

  <a href="https://x.com/RushikeshYeole_" target="_blank" rel="noopener noreferrer" className=" ml-10 text-xs font-mono">
    Neokey · Rushikesh Yeole
  </a>

  <a href="https://x.com/RushikeshYeole_" target="_blank" rel="noopener noreferrer">
    {<img src={assets.x} alt="Logo" className="w-7 mr-2 ml-2  cursor-pointer" />}
  </a>

  <a href="https://www.linkedin.com/in/rushikesh-yeole-9115702aa/" target="_blank" rel="noopener noreferrer">
    {<img src={assets.lnkd} alt="Logo" className="w-5 mr-2 cursor-pointer" />}
  </a>

  {/* <p className="text-xs"> a Rushikesh Yeole production <br></br> Neokey 2025 </p> */}
  </div>  
</footer>
  );
};

export default Footer;
