import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <footer className="w-full flex justify-center items-center text-center py-4 text-inherit border-t border-[currentColor]">
      
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">

        <a 
          href="https://x.com/RushikeshYeole_" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-xs font-mono transition-opacity hover:opacity-80"
        >
          Neokey (2026) · Rushikesh Yeole
        </a>

        <div className="flex items-center gap-3">
          <a href="https://x.com/RushikeshYeole_" target="_blank" rel="noopener noreferrer">
            <img 
              src={assets.x} 
              alt="X (Twitter) Logo" 
              className="w-7 cursor-pointer transition-transform hover:scale-150 hover:glow-logo" 
            />
          </a>

          <a href="https://www.linkedin.com/in/rushikesh-yeole-9115702aa/" target="_blank" rel="noopener noreferrer">
            <img 
              src={assets.lnkd} 
              alt="LinkedIn Logo" 
              className="w-5 cursor-pointer transition-transform hover:scale-150 hover:glow-logo " 
            />
          </a>
        </div>

      </div>  
    </footer>
  );
};

export default Footer;