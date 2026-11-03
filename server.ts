import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'pelada_data.json');

// Initialize or read storage
function readStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (!parsed.playerPasswords) parsed.playerPasswords = {};
      if (!parsed.sessions) parsed.sessions = {};
      if (!parsed.managerPassword) parsed.managerPassword = 'gestor123';
      return parsed;
    }
  } catch (err) {
    console.error('Error reading storage file:', err);
  }
  return {
    managerPassword: 'gestor123',
    users: [
      {
        id: 'usr-admin',
        email: 'organizador@futebol.com',
        password: '123',
        name: 'Organizador',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    ],
    playerPasswords: {},
    sessions: {},
  };
}

function writeStore(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing storage file:', err);
  }
}

// 4 Days in Milliseconds: 4 * 24 * 60 * 60 * 1000
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

// Helper: check if session has expired (4 days limit)
function isSessionExpired(session: any): boolean {
  if (!session || !session.createdAt) return false;
  const createdTime = new Date(session.createdAt).getTime();
  const now = Date.now();
  return (now - createdTime) > FOUR_DAYS_MS;
}

// ==========================================
// --- API ROUTES ---
// ==========================================

// 1. Auth: Player Login by Name/ID and Password
app.post('/api/auth/player-login', (req, res) => {
  const { playerId, password, playerName } = req.body;
  if (!playerId || !password) {
    return res.status(400).json({ error: 'Selecione o jogador e digite suásenha.' });
  }

  const store = readStore();
  const passStr = String(password).trim();
  const savedPassword = store.playerPasswords[playerId];

  // Default initial password is '1234' if never customized
  const expectedPass = savedPassword || '1234';

  if (passStr !== expectedPass) {
    return res.status(401).json({
      error: 'Senha incorreta! A senha padrão inicial é 1234 (ou ásuásenha personalizada cadastrada).',
    });
  }

  return res.json({
    success: true,
    playerId,
    name: playerName || 'Jogador',
    message: 'Login realizado com sucesso!',
  });
});

// 2. Auth: Change / Set Player Password
app.post('/api/auth/player-set-password', (req, res) => {
  const { playerId, currentPassword, newPassword } = req.body;
  if (!playerId || !newPassword) {
    return res.status(400).json({ error: 'Informe a novásenha.' });
  }

  const newPassStr = String(newPassword).trim();
  if (newPassStr.length < 3) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 3 caracteres.' });
  }

  const store = readStore();
  const savedPass = store.playerPasswords[playerId] || '1234';

  if (currentPassword && String(currentPassword).trim() !== savedPass) {
    return res.status(401).json({ error: 'A senha atual está incorreta.' });
  }

  store.playerPasswords[playerId] = newPassStr;
  writeStore(store);

  return res.json({ success: true, message: 'Senha atualizada com sucesso!' });
});

// 3. Auth: Register (Legacy or Admin)
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, playerId } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Nome, email e senhásão obrigatórios' });
  }

  const store = readStore();
  const emailNorm = email.trim().toLowerCase();
  const existing = store.users.find((u: any) => u.email.toLowerCase() === emailNorm);
  if (existing) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    email: emailNorm,
    password: String(password).trim(),
    name: String(name).trim(),
    playerId: playerId || null,
    role: store.users.length <= 1 ? 'admin' : 'player',
    createdAt: new Date().toISOString(),
  };

  store.users.push(newUser);
  writeStore(store);

  const { password: _, ...userSafe } = newUser;
  return res.json({ user: userSafe });
});

// 4. Auth: Login (Legacy)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha' });
  }

  const store = readStore();
  const emailNorm = email.trim().toLowerCase();
  const passStr = String(password).trim();

  const user = store.users.find(
    (u: any) => u.email.toLowerCase() === emailNorm && u.password === passStr
  );

  if (!user) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });
  }

  const { password: _, ...userSafe } = user;
  return res.json({ user: userSafe });
});

// 5. Voting Session: Get Current Weekly Session (With 4-day deadline check)
app.get('/api/voting/current', (req, res) => {
  const store = readStore();
  const today = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  // Find most recent session or create current
  let latestSession: any = null;
  const sessionKeys = Object.keys(store.sessions);
  if (sessionKeys.length > 0) {
    const sorted = sessionKeys
      .map((k) => store.sessions[k])
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    latestSession = sorted[0];
  }

  if (!latestSession) {
    const weekId = `semana-${today}`;
    latestSession = {
      id: weekId,
      weekId,
      date: today,
      createdAt: nowIso,
      title: `Rodada de Terça (${today})`,
      isOpen: true,
      votedPlayerIds: [],
      votedUserEmails: [],
      anonymousRatings: {},
      updatedAt: nowIso,
    };
    store.sessions[weekId] = latestSession;
    writeStore(store);
  }

  // Check 4-day expiry
  const expired = isSessionExpired(latestSession);
  const timeLeftMs = Math.max(0, (new Date(latestSession.createdAt).getTime() + FOUR_DAYS_MS) - Date.now());

  return res.json({
    session: latestSession,
    isExpired: expired,
    timeLeftMs,
  });
});

// 6. Voting Session: Toggle Open/Close
app.post('/api/voting/toggle', (req, res) => {
  const { weekId, isOpen } = req.body;
  const store = readStore();
  if (store.sessions && store.sessions[weekId]) {
    store.sessions[weekId].isOpen = Boolean(isOpen);
    store.sessions[weekId].updatedAt = new Date().toISOString();
    writeStore(store);
    return res.json({ session: store.sessions[weekId] });
  }
  return res.status(404).json({ error: 'Sessão não encontrada' });
});

// 7. Voting Session: Start a New Round (Next Game / Próximo Jogo) - REQUIRES GESTOR PASSWORD
app.post('/api/voting/new-round', (req, res) => {
  const { managerPassword } = req.body;
  const store = readStore();
  const expectedPassword = store.managerPassword || 'gestor123';

  if (!managerPassword || String(managerPassword).trim() !== String(expectedPassword).trim()) {
    return res.status(401).json({
      error: 'Senha de gestor incorreta! Apenas os organizadores do futebol podem liberar uma nova rodada.',
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const newWeekId = `semana-${today}-${Date.now()}`;
  const nowIso = new Date().toISOString();

  const newSession = {
    id: newWeekId,
    weekId: newWeekId,
    date: today,
    createdAt: nowIso,
    title: `Rodada de Terça (${today})`,
    isOpen: true,
    votedPlayerIds: [],
    votedUserEmails: [],
    anonymousRatings: {},
    updatedAt: nowIso,
  };

  if (!store.sessions) store.sessions = {};
  store.sessions[newWeekId] = newSession;
  writeStore(store);

  return res.json({
    success: true,
    message: 'Nova rodada de votação liberada! Todos os jogadores podem votar pelos próximos 4 dias.',
    session: newSession,
    isExpired: false,
    timeLeftMs: FOUR_DAYS_MS,
  });
});

// 7.1 Gestor Password Management
app.post('/api/voting/set-manager-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const store = readStore();
  const expectedPassword = store.managerPassword || 'gestor123';

  if (!currentPassword || String(currentPassword).trim() !== String(expectedPassword).trim()) {
    return res.status(401).json({ error: 'Senha atual de gestor incorreta.' });
  }

  const trimmedNew = String(newPassword || '').trim();
  if (trimmedNew.length < 3) {
    return res.status(400).json({ error: 'A novásenha deve ter no mínimo 3 caracteres.' });
  }

  store.managerPassword = trimmedNew;
  writeStore(store);

  return res.json({ success: true, message: 'Senha do gestor alterada com sucesso!' });
});

// 8. Voting Session: Submit Anonymous Ballot by Player ID (Strict 1 Vote per Person & 4-Day Lock)
app.post('/api/voting/submit-player-ballot', (req, res) => {
  const { weekId, voterPlayerId, ratings } = req.body;
  if (!weekId || !voterPlayerId || !ratings || !Array.isArray(ratings)) {
    return res.status(400).json({ error: 'Parâmetros incompletos para envio de notas.' });
  }

  const store = readStore();
  if (!store.sessions) store.sessions = {};
  let session = store.sessions[weekId];

  if (!session) {
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    session = {
      id: weekId,
      weekId,
      date: today,
      createdAt: nowIso,
      title: `Rodada de Terça (${today})`,
      isOpen: true,
      votedPlayerIds: [],
      votedUserEmails: [],
      anonymousRatings: {},
      updatedAt: nowIso,
    };
    store.sessions[weekId] = session;
  }

  // Check 4-Day Deadline
  if (isSessionExpired(session)) {
    return res.status(400).json({
      error: 'O prazo de 4 dias para votar nesta rodada expirou! A votação foi bloqueada até o próximo jogo.',
    });
  }

  if (!session.isOpen) {
    return res.status(400).json({ error: 'A votação desta rodada está temporariamente fechada pelo organizador.' });
  }

  if (!session.votedPlayerIds) session.votedPlayerIds = [];

  // Check strict 1 vote per player
  if (session.votedPlayerIds.includes(voterPlayerId)) {
    return res.status(400).json({
      error: 'Você já enviou seu voto para esta rodada! Apenas 1 voto por jogador é permitido.',
    });
  }

  // Register player vote
  session.votedPlayerIds.push(voterPlayerId);

  // Anonymously accumulate grades for each evaluated player
  if (!session.anonymousRatings) session.anonymousRatings = {};
  for (const item of ratings) {
    if (item.playerId && typeof item.score === 'number' && item.playerId !== voterPlayerId) {
      const scoreNum = Math.max(0, Math.min(10, Math.round(item.score * 10) / 10));
      if (!session.anonymousRatings[item.playerId]) {
        session.anonymousRatings[item.playerId] = [];
      }
      session.anonymousRatings[item.playerId].push(scoreNum);
    }
  }

  session.updatedAt = new Date().toISOString();
  writeStore(store);

  return res.json({
    success: true,
    message: 'Seu voto anônimo foi registrado com sucesso! Ninguém verá as notas individuais.',
    session,
  });
});

// 9. Legacy Voting Session Submit
app.post('/api/voting/submit', (req, res) => {
  const { weekId, voterEmail, ratings } = req.body;
  if (!weekId || !voterEmail || !ratings || !Array.isArray(ratings)) {
    return res.status(400).json({ error: 'Parâmetros incompletos para envio de notas.' });
  }

  const store = readStore();
  if (!store.sessions) store.sessions = {};
  let session = store.sessions[weekId];

  if (!session) {
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    session = {
      id: weekId,
      weekId,
      date: today,
      createdAt: nowIso,
      title: `Rodada de Terça (${today})`,
      isOpen: true,
      votedPlayerIds: [],
      votedUserEmails: [],
      anonymousRatings: {},
      updatedAt: nowIso,
    };
    store.sessions[weekId] = session;
  }

  if (isSessionExpired(session)) {
    return res.status(400).json({
      error: 'O prazo de 4 dias para votar expirou! Aguarde a liberação do próximo jogo.',
    });
  }

  if (!session.isOpen) {
    return res.status(400).json({ error: 'A votação desta rodada está fechada no momento.' });
  }

  const emailNorm = voterEmail.trim().toLowerCase();
  if (!session.votedUserEmails) session.votedUserEmails = [];
  if (session.votedUserEmails.includes(emailNorm)) {
    return res.status(400).json({
      error: 'Você já enviou seu voto para esta rodada! Apenas 1 voto por pessoa é permitido por semana.',
    });
  }

  session.votedUserEmails.push(emailNorm);

  if (!session.anonymousRatings) session.anonymousRatings = {};
  for (const item of ratings) {
    if (item.playerId && typeof item.score === 'number') {
      const scoreNum = Math.max(0, Math.min(10, Math.round(item.score * 10) / 10));
      if (!session.anonymousRatings[item.playerId]) {
        session.anonymousRatings[item.playerId] = [];
      }
      session.anonymousRatings[item.playerId].push(scoreNum);
    }
  }

  session.updatedAt = new Date().toISOString();
  writeStore(store);

  return res.json({
    success: true,
    message: 'Seu voto anônimo foi registrado com sucesso! Ninguém verá as notas individuais.',
    session,
  });
});

// ==========================================
// --- VITE MIDDLEWARE SETUP ---
// ==========================================
async function startServer() {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Full-stack Pelada App rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
