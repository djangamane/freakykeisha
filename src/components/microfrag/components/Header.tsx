
import React, { useState } from 'react';
import { useBiasAuth } from '../../../contexts/BiasAuthContext';
import BiasAuthModal from '../../BiasAuthModal';

const Header: React.FC = () => {
  const { user, logout } = useBiasAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthClick = () => {
    if (user?.isGuest) {
      // For guest users, show the auth modal
      setShowAuthModal(true);
    } else {
      // For authenticated users, log out
      logout();
    }
  };

  return (
    <>
      <header className="bg-black/90 backdrop-blur-sm border-b border-green-500/30 sticky top-0 z-20 shadow-lg shadow-green-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-black text-green-400 tracking-tight font-mono">
                Fragile News Decoder <span className="text-cyan-400 animate-pulse">AI</span>
              </h1>
              <p className="text-xs text-green-300/70 mt-1 font-mono">
                Analysis based on the frameworks of Dr. Frances Cress Welsing & Dr. Amos Wilson
              </p>
            </div>

            {/* Authentication Section */}
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-green-300/80 font-mono">
                  {user.isGuest ? 'Guest User' : user.email}
                </span>
                <button
                  onClick={handleAuthClick}
                  className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 hover:border-green-400 text-green-400 px-4 py-2 rounded-lg font-mono text-sm transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20"
                >
                  {user.isGuest ? 'Sign In' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <BiasAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => setShowAuthModal(false)}
        onGuestMode={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default Header;
