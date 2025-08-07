
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-green-900/30"></div>
        <div className="absolute inset-0 rounded-full border-4 border-green-400 border-t-transparent animate-spin shadow-lg shadow-green-400/50"></div>
      </div>
      <p className="text-green-300 text-lg font-mono animate-pulse">ANALYZING ARTICLE...</p>
      <p className="text-green-300/70 text-sm font-mono mt-2">This may take a moment.</p>
    </div>
  );
};

export default Loader;
