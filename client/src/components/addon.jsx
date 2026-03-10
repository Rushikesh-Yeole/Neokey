import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Reframe = () => {
  const location = useLocation();

  useEffect(() => {
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        });
      }
    }, 0);
  }, [location]);

  return null;
};

export default Reframe;