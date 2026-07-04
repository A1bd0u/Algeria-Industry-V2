import { motion } from 'motion/react';
import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for smooth feel
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
