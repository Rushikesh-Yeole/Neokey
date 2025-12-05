import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Reframe = () => {
  const location = useLocation();

  useEffect(() => {
    // Ensure scrolling to the top
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth', // Adds a smooth scrolling effect
        });
      }
    }, 0);
  }, [location]);

  return null;
};

export default Reframe;