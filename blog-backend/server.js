// blog-backend/server.js
// Egyedi json-server a blog projekthez – token-alapú hitelesítéssel

const jsonServer = require('json-server');
const crypto = require('crypto');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// ── Segédfüggvények ─────────────────────────────────────────────────────────

/** Véletlen hex token generálás */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * A kérés Authorization fejlécéből kinyeri a tokent,
 * megkeresi az adatbázisban, és visszaadja a hozzá tartozó
 * felhasználó objektumot – vagy null-t, ha érvénytelen.
 */
function getUserFromRequest(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  const db = router.db;

  const tokenObj = db.get('tokens').find({ token }).value();
  if (!tokenObj) return null;

  return db.get('users').find({ id: tokenObj.userId }).value() || null;
}

// ── CORS fejlécek (Vite dev szerver miatt) ───────────────────────────────────

server.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

// ── Egyedi végpontok ─────────────────────────────────────────────────────────

/**
 * POST /api/login
 * Body: { username, password }
 * Sikeres: { token, user: { id, username, role, nev } }
 */
server.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: 'A felhasználónév és a jelszó megadása kötelező!' });
  }

  const db = router.db;
  const user = db.get('users').find({ username, password }).value();

  if (!user) {
    return res
      .status(401)
      .json({ error: 'Hibás felhasználónév vagy jelszó!' });
  }

  // Régi tokenek törlése ugyanehhez a felhasználóhoz
  db.get('tokens').remove({ userId: user.id }).write();

  const token = generateToken();
  db.get('tokens')
    .push({ id: Date.now(), token, userId: user.id })
    .write();

  return res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, nev: user.nev },
  });
});

/**
 * POST /api/logout
 * Header: Authorization: Bearer <token>
 */
server.post('/api/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    router.db.get('tokens').remove({ token }).write();
  }
  return res.json({ message: 'Sikeres kijelentkezés!' });
});

/**
 * GET /api/me
 * Visszaadja a bejelentkezett felhasználó adatait (token alapján).
 */
server.get('/api/me', (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Nem vagy bejelentkezve!' });
  }
  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    nev: user.nev,
  });
});

// ── Jogosultság-ellenőrző middleware a /posts végpontokhoz ───────────────────

server.use('/posts', (req, res, next) => {
  // GET kérések publikusak
  if (req.method === 'GET') return next();

  // Minden más (POST, PUT, PATCH, DELETE) hitelesítést igényel
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Hitelesítés szükséges!' });
  }

  // DELETE: csak admin szerepkör engedélyezett
  if (req.method === 'DELETE' && user.role !== 'admin') {
    return res
      .status(403)
      .json({ error: 'Törlési jog csak admin szerepkörhöz tartozik!' });
  }

  // POST, PUT, PATCH: adminisztrátor és admin egyaránt megengedett
  next();
});

// ── A json-server router kezel mindent mást ──────────────────────────────────

server.use(router);

// ── Szerver indítása ─────────────────────────────────────────────────────────

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Blog backend fut: http://localhost:${PORT}`);
  console.log('Elérhető végpontok:');
  console.log('  POST   /api/login');
  console.log('  POST   /api/logout');
  console.log('  GET    /api/me');
  console.log('  GET    /posts          (publikus)');
  console.log('  GET    /posts/:id      (publikus)');
  console.log('  POST   /posts          (adminisztrátor, admin)');
  console.log('  PUT    /posts/:id      (adminisztrátor, admin)');
  console.log('  DELETE /posts/:id      (csak admin)');
  console.log('  GET    /categories     (publikus)');
});
