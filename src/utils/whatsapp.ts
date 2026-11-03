import { Team, BalanceResult, Player } from '../types/football';

export function formatTeamsForWhatsApp(
  teams: Team[],
  balanceResult?: BalanceResult | null,
  benchPlayers: Player[] = [],
  peladaName: string = 'Futebol de Terça'
): string {
  const dateStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  let text = `⚽ *${peladaName.toUpperCase()}* ⚽\n`;
  text += `📅 _${capitalizedDate}_\n`;

  if (balanceResult) {
    text += `⚖️ *Equilíbrio:* ${balanceResult.fairnessScore}% | Tentativa #${balanceResult.attemptNumber || 1}\n`;
  }
  text += `👥 *Formato:* 18 Fixos (3 times de 6) + Lista de Suplentes\n`;
  text += `═══════════════════════\n\n`;

  const getEmojiForColor = (colorName: string) => {
    if (colorName.includes('Amarelo')) return '🟡';
    if (colorName.includes('Azul')) return '🔵';
    if (colorName.includes('Vermelho')) return '🔴';
    if (colorName.includes('Preto')) return '⚫';
    if (colorName.includes('Verde')) return '🟢';
    if (colorName.includes('Laranja')) return '🟠';
    return '⚪';
  };

  teams.forEach((team, idx) => {
    const emoji = getEmojiForColor(team.colorName);
    text += `${emoji} *${team.name.toUpperCase()}* (6 atletas)\n`;
    text += `📊 Média Técnica: *${team.stats.avgOverall.toFixed(1)}*\n`;

    const gks = team.players.filter((p) => p.primaryPosition === 'GOL');
    const defs = team.players.filter((p) => p.primaryPosition === 'ZAG');
    const mids = team.players.filter((p) => p.primaryPosition === 'MEI');
    const atks = team.players.filter((p) => p.primaryPosition === 'ATA');

    if (gks.length > 0) {
      text += `🧤 *GOL:* ${gks.map((p) => `${p.nickname || p.name} (★${p.currentRating.toFixed(1)})`).join(', ')}\n`;
    }
    if (defs.length > 0) {
      text += `🛡️ *ZAG:* ${defs.map((p) => `${p.nickname || p.name} (★${p.currentRating.toFixed(1)})`).join(', ')}\n`;
    }
    if (mids.length > 0) {
      text += `🎯 *MEI:* ${mids.map((p) => `${p.nickname || p.name} (★${p.currentRating.toFixed(1)})`).join(', ')}\n`;
    }
    if (atks.length > 0) {
      text += `⚡ *ATA:* ${atks.map((p) => `${p.nickname || p.name} (★${p.currentRating.toFixed(1)})`).join(', ')}\n`;
    }

    if (idx < teams.length - 1) {
      text += `\n───────────────────────\n\n`;
    }
  });

  // Lista de Suplentes (Espera)
  if (benchPlayers.length > 0) {
    text += `\n═══════════════════════\n`;
    text += `⏳ *LISTA DE SUPLENTES (ESPERA)*\n`;
    benchPlayers.forEach((p, idx) => {
      text += `${idx + 1}º ${p.nickname || p.name} (${p.primaryPosition} - ★${p.currentRating.toFixed(1)})\n`;
    });
    text += `_Se houver desfalque nos 18 fixos, o suplente assume a vaga!_\n`;
  }

  text += `\n═══════════════════════\n`;
  text += `⏱️ Partidas de 10 min | Quem ganha fica!\n`;
  text += `📱 _Sorteado via Futebol de Terça_\n`;

  return text;
}
