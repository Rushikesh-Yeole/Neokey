const Footer = () => {
return(
<footer className="w-full flex justify-between items-center text-center py-2 text-inherit border-t border-[currentColor]">
  <div className="flex justify-center flex-grow">
  <a   href="https://github.com/Rushikesh-Yeole" className="text-xs"> a Rushikesh Yeole production</a>
  {/* <p className="text-xs"> a Rushikesh Yeole production <br></br> Neokey 2025 </p> */}
  {/* <a href="https://github.com/Rushikesh-Yeole" target="_blank" rel="noopener noreferrer">
  {<img src={assets.github} alt="Logo" className="w-10 ml-4 cursor-pointer" />}
  </a> */}
  </div>  
</footer>
  );
};

export default Footer;
