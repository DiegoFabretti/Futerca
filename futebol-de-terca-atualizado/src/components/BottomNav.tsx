import React from 'react';
import { Shuffle, Users, Timer, Trophy, Award } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'draw' | 'players' | 'matches' | 'stats' | 'voting';
  setActiveTab: (tab: 'draw' | 'players' | 'matches' | 'stats' | 'voting') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto">
        <button
          onClick={() => setActiveTab('draw')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'draw' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shuffle className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Sorteio</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'matches' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Timer className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Pelada</span>
        </button>

        {/* Center Prominent VOTAR tab */}
        <button
          onClick={() => setActiveTab('voting')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer relative ${
            activeTab === 'voting' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'voting' ? 'bg-emerald-500/20 text-emerald-300' : 'text-emerald-400'}`}>
            <Award className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Notas</span>
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'players' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Elenco</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'stats' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Tabela</span>
        </button>
      </div>
    </nav>
  );
};
