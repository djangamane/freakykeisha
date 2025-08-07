
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Bias Detector <span className="text-yellow-400">AI</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Analysis based on the frameworks of Dr. Frances Cress Welsing & Dr. Amos Wilson
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
