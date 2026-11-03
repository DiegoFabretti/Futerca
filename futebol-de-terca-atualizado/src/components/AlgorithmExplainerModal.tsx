import React from 'react';
import { X, ShieldCheck, Scale, Users, RefreshCw } from 'lucide-react';

interface AlgorithmExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlgorithmExplainerModal: React.FC<AlgorithmExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Como Funciona o Sorteio Inteligente?</h3>
              <p className="text-xs text-slate-400">Algoritmo de balanceamento por notas e posições</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-300">
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
              <span>Segregação dos Potes por Posição</span>
            </div>
            <p className="text-slate-400 text-xs pl-7">
              Os atletas confirmados são divididos em 4 potes táticos: <strong>Goleiros (GOL)</strong>, <strong>Zagueiros (ZAG)</strong>, <strong>Meio-campistas (MEI)</strong> e <strong>Atacantes (ATA)</strong>, ordenados individualmente pela nota geral (Overall de 1 a 10).
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">2</span>
              <span>Distribuição Primária dos Goleiros</span>
            </div>
            <p className="text-slate-400 text-xs pl-7">
              Em qualquer pelada, o goleiro é a posição mais crítica. O algoritmo distribuiçãos goleiros primeiro via <em>Snake Draft</em> (o melhor vai pro Time 1, o segundo pro Time 2, etc.), garantindo que nenhum time jogue sem arqueiro.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">3</span>
              <span>Draft Guloso Posicional (Positional Greedy)</span>
            </div>
            <p className="text-slate-400 text-xs pl-7">
              Para Zagueiros, Meias e Atacantes, cada jogador de elite é alocado no time que:
              <br />• Ainda tem vaga dentro do limite do elenco;
              <br />• Possui a maior carência daquela posição específica;
              <br />• Possui a menor média técnica no momento da escolha.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">4</span>
              <span>Otimização Heurística de Trocas (2-Opt Swaps)</span>
            </div>
            <p className="text-slate-400 text-xs pl-7">
              Após o draft inicial, o algoritmo simula até 100 trocas diretas 1-a-1 entre jogadores da <strong>mesma posição</strong> entre os times, buscando minimizar a variância total das médias:
              <br />
              <code className="text-emerald-300 font-mono text-[11px] block mt-1 bg-slate-900 px-2 py-1 rounded">
                Var = Σ (Média_Time - Média_Geral)²
              </code>
              Isso reduz a diferença entre o time mais forte e o mais fraco a míseros <strong>0.1 a 0.2 pontos</strong>, sem quebrar a espinha dorsal de posições.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Entendi, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
