'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export const BakeryHero: React.FC = () => {
  return (
    <motion.section 
      className="relative bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 py-6 md:py-20">
        <div className="max-w-lg">
          <motion.h1 
            className="text-2xl md:text-5xl font-bold text-amber-900 mb-2 md:mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            新鮮出爐的幸福滋味
          </motion.h1>
          <motion.p 
            className="text-base md:text-lg text-amber-800 mb-6 md:mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            採用頂級食材，每日新鮮製作，帶給您最道地的烘焙美食體驗。
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <button 
              onClick={() => {
                const productsSection = document.getElementById('products-section');
                if (productsSection) {
                  window.scrollTo({
                    top: productsSection.offsetTop - 100,
                    behavior: 'smooth'
                  });
                }
              }}
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 md:py-3 px-6 md:px-8 rounded-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0 transition-transform"
            >
              立即選購
            </button>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 w-1/3 h-full bg-amber-200 opacity-50 -skew-x-12 transform origin-bottom-right"></div>
    </motion.section>
  );
}; 