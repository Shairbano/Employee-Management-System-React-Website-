import React from 'react';

const Loading = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-50">
      <div className="relative flex items-center justify-center">
        {/* Outer Spinning Ring */}
        <div className="w-28 h-28 border-4 border-transparent border-t-teal-500 border-b-teal-500 rounded-full animate-spin"></div>
        
        {/* Inner Static Ring for depth */}
        <div className="absolute w-28 h-28 border-4 border-gray-700 rounded-full"></div>
        
        {/* Pulsing EMS Logo */}
        <div className="absolute font-black text-2xl text-white tracking-widest animate-pulse">
          EMS
        </div>
      </div>
      
      {/* Optional Loading Text */}
      <p className="mt-6 text-teal-500 font-medium tracking-widest uppercase text-xs animate-bounce">
        Initializing System...
      </p>
    </div>
  );
};

export default Loading;