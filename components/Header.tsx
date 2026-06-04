import React from 'react';
import { RefreshCw, Calendar, Globe } from 'lucide-react';
import NotificationManager from './NotificationManager';

interface HeaderProps {
  onGenerate: () => void;
  isLoading: boolean;
  currentDate: string;
}

const CustomLogo = () => (
  <svg viewBox="0 0 120 80" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sun */}
    <path d="M 55 35 A 16 16 0 0 1 87 35" fill="#FBBF24" />
    <path d="M 71 15 L 71 5 M 55 22 L 45 12 M 87 22 L 97 12" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
    
    {/* Infinity Right (Blue) */}
    <path d="M 60 50 C 75 20, 110 25, 105 55 C 100 85, 65 75, 60 50" stroke="#0284C7" strokeWidth="6" strokeLinecap="round" />
    
    {/* Infinity Left (Green) */}
    <path d="M 60 50 C 45 80, 10 75, 15 45 C 20 15, 55 25, 60 50" stroke="#16A34A" strokeWidth="6" strokeLinecap="round" />
    
    {/* Leaves */}
    <path d="M 15 45 Q 0 20 20 10 Q 35 25 15 45 Z" fill="#16A34A" />
    <path d="M 35 65 Q 20 45 40 35 Q 55 50 35 65 Z" fill="#16A34A" />
  </svg>
);

const Header: React.FC<HeaderProps> = ({ onGenerate, isLoading, currentDate }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center">
              <CustomLogo />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">
                BRIEFING STRATÉGIQUE
              </h1>
              <p className="text-xs text-green-600 font-semibold uppercase tracking-widest mt-1">
                FONDATION OCP
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 capitalize">{currentDate}</span>
            </div>
            
            <NotificationManager />

            <button
              onClick={onGenerate}
              disabled={isLoading}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white shadow-md transition-all
                ${isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-slate-800 hover:shadow-lg active:transform active:scale-95'}
              `}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Analyse en cours...' : 'Générer le Briefing'}
            </button>
          </div>

        </div>
      </div>
      
      {/* Decorative Bar */}
      <div className="h-1 w-full flex">
        <div className="w-1/3 bg-red-600"></div>
        <div className="w-1/3 bg-green-600"></div>
        <div className="w-1/3 bg-yellow-500"></div>
      </div>
    </header>
  );
};

export default Header;