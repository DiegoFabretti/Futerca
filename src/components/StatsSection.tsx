import React, { useRef, useState } from 'react';
import { Trophy, Award, Download, Upload, RotateCcw, Shield } from 'lucide-react';
import { Team, Match, Player, TeamStanding } from '../types/football';
import { soundEffects } from '../utils/audio';

interface StatsSectionProps {
  teams: Team[];
  matches: Match[];
  players: Player[];
  onResetToDefaults: () => void;
  onImportData: (data: { players: Player[]; matches: Match[]; teams: Team[] }) => void;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  teams,
  matches,
  players,
  onResetToDefaults,
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusNotice, setStatusNotice] = useState<string>('');
  const [confirmReset, setConfirmReset] = useState(false);

  // Compute standings table based on completed matches
  const standingsMap: Record<string, TeamStanding> = {};

  teams.forEach((t) => {
    standingsMap[t.id] = {
      teamId: t.id,
      teamName: t.name,
      colorHex: t.colorHex,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    };
  });

  matches.forEach((m) => {
    if (!m.completed) return;
    const stdA = standingsMap[m.teamAId];
    const stdB = standingsMap[m.teamBId];

    if (stdA && stdB) {
      stdA.played += 1;
      stdB.played += 1;
      stdA.goalsFor += m.scoreA;
      stdA.goalsAgainst += m.scoreB;
      stdB.goalsFor += m.scoreB;
      stdB.goalsAgainst += m.scoreA;

      if (m.scoreA > m.scoreB) {
        stdA.won += 1;
        stdA.points += 3;
        stdB.lost += 1;
      } else if (m.scoreB > m.scoreA) {
        stdB.won += 1;
        stdB.points += 3;
        stdA.lost += 1;
      } else {
        stdA.drawn += 1;
        stdB.drawn += 1;
        stdA.points += 1;
        stdB.points += 1;
      }

      stdA.goalDiff = stdA.goalsFor - stdA.goalsAgainst;
      stdB.goalDiff = stdB.goalsFor - stdB.goalsAgainst;
    }
  });

  const standingsList = Object.values(standingsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });

  // Top scorers
  const topScorers = [...players]
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10);

  // Export JSON backup
  const handleExportBackup = () => {
    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      players,
      teams,
      matches,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `futebol-terca-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundEffects.playTap();
  };

  // Import JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.players && Array.isArray(parsed.players)) {
          onImportData(parsed);
          setStatusNotice('Dados importados com sucesso!');
          soundEffects.playTap();
          setTimeout(() => setStatusNotice(''), 4000);
        } else {
          setStatusNotice('Arquivo de backup inválido.');
          setTimeout(() => setStatusNotice(''), 4000);
        }
      } catch {
        setStatusNotice('Erro ao ler arquivo JSON.');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {statusNotice && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-semibold flex items-center justify-between">
          <span>{statusNotice}</span>
          <button type="button" onClick={() => setStatusNotice('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}
      {/* 1. Tabela de Classificação da Noite */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Classificação da Terça</span>
            </h3>
            <p className="text-xs text-slate-400">
              Pontuação atualizada em tempo real conforme as partidas são finalizadas
            </p>
          </div>
        </div>

        {teams.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            Nenhum time sorteado ainda. Realize o sorteio para gerar a tabela da noite.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-2 text-center">PTS</th>
                  <th className="py-2.5 px-2 text-center">J</th>
                  <th className="py-2.5 px-2 text-center">V</th>
                  <th className="py-2.5 px-2 text-center">E</th>
                  <th className="py-2.5 px-2 text-center">D</th>
                  <th className="py-2.5 px-2 text-center">GP</th>
                  <th className="py-2.5 px-2 text-center">GC</th>
                  <th className="py-2.5 px-2 text-center">SG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {standingsList.map((row, idx) => (
                  <tr key={row.teamId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}º</td>
                    <td className="py-3 px-3 font-sans font-semibold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.colorHex }} />
                      <span>{row.teamName}</span>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-400 text-sm">
                      {row.points}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-300">{row.played}</td>
                    <td className="py-3 px-2 text-center text-slate-300">{row.won}</td>
                    <td className="py-3 px-2 text-center text-slate-300">{row.drawn}</td>
                    <td className="py-3 px-2 text-center text-slate-300">{row.lost}</td>
                    <td className="py-3 px-2 text-center text-slate-300">{row.goalsFor}</td>
                    <td className="py-3 px-2 text-center text-slate-400">{row.goalsAgainst}</td>
                    <td className={`py-3 px-2 text-center font-semibold ${row.goalDiff > 0 ? 'text-emerald-400' : row.goalDiff < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 2. Artilharia da Terça-Feira */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-rose-400" />
              <span>Chuteira de Ouro · Artilharia</span>
            </h3>
            <p className="text-xs text-slate-400">
              Ranking dos maiores artilheiros da pelada
            </p>
          </div>
        </div>

        {topScorers.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            Nenhum gol registrado ainda. Use o botão <strong>+ Gol</strong> durante as partidas para registrar!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topScorers.map((scorer, rank) => (
              <div
                key={scorer.id}
                className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg font-mono font-bold flex items-center justify-center text-xs ${
                      rank === 0
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                        : rank === 1
                        ? 'bg-slate-300 text-slate-950'
                        : rank === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rank + 1}º
                  </div>
                  <div>
                    <span className="font-semibold text-white text-xs block">
                      {scorer.nickname || scorer.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {scorer.primaryPosition} · Nota ★{scorer.currentRating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono font-bold text-emerald-400 text-sm bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <span>⚽ {scorer.goals}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Gerenciamento Local & Backup */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-white">Dados Locais (LocalStorage)</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Todos os jogadores, notas e partidas ficam gravados localmente no seu navegador. Você pode exportar uma cópia de segurança em formato JSON para enviar aos amigos ou carregar em outro celular.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Backup JSON</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Importar Backup</span>
          </button>

          {confirmReset ? (
            <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-rose-500/30">
              <span className="text-[11px] text-rose-300 font-semibold">Restaurar elenco inicial?</span>
              <button
                type="button"
                onClick={() => {
                  onResetToDefaults();
                  soundEffects.playTap();
                  setConfirmReset(false);
                  setStatusNotice('Elenco restaurado com os 18 atletas pré-configurados!');
                  setTimeout(() => setStatusNotice(''), 4000);
                }}
                className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer"
              >
                Sim, resetar
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Resetar Elenco Inicial</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
