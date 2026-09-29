const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: 'text/*', limit: '10mb' }));
app.use(express.static(__dirname));

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir(path.join(__dirname, 'backup'));
ensureDir(path.join(__dirname, 'permanent'));
ensureDir(path.join(__dirname, 'public'));

function makeHash(s){
  let h=0;
  for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h=h&h;}
  return Math.abs(h).toString(16).toUpperCase();
}

app.post('/api/backup', (req, res) => {
  try{
    const data = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const hash = makeHash(data + Date.now());
    const time = new Date().toISOString();
    fs.writeFileSync(path.join(__dirname, 'backup', `${hash}.json`), JSON.stringify({ hash, data, time }, null, 2));
    const historyPath = path.join(__dirname, 'backup', 'history.json');
    let history = [];
    if (fs.existsSync(historyPath)) { try{ history = JSON.parse(fs.readFileSync(historyPath, 'utf8')); }catch(e){ history = []; } }
    history.unshift({ hash, time });
    if (history.length > 100) history = history.slice(0,100);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    fs.writeFileSync(path.join(__dirname, 'backup', 'index.html'), `<h1>BACKUP LIVE</h1><p>${hash}</p><p>${time}</p>`);
    res.json({ ok: true, hash, msg: 'TERMUX → BACKUP ✅' });
  }catch(e){ res.json({ ok: false, msg: e.message }); }
});

app.post('/api/permanent', (req, res) => {
  const confirm = req.headers['x-surokkha-confirm'];
  if (confirm !== 'USER_CONFIRMED') {
    return res.status(403).json({ ok: false, msg: '❌ BLOCKED: TERMUX → PERMANENT ❌' });
  }
  try{
    const { hash } = req.body || {};
    if (!hash) return res.json({ ok: false, msg: 'No hash' });
    const time = new Date().toISOString();
    fs.writeFileSync(path.join(__dirname, 'permanent', 'permanent.json'), JSON.stringify({ hash, time }, null, 2));
    fs.writeFileSync(path.join(__dirname, 'permanent', 'index.html'), `<h1>PERMANENT LIVE</h1><p>${hash}</p><p>${time}</p><p>✅ VERIFIED → PERMANENT LIVE</p>`);
    res.json({ ok: true, hash, msg: '✅ PERMANENT LIVE' });
  }catch(e){ res.json({ ok: false, msg: e.message }); }
});

app.get('/api/history', (req, res) => {
  const p = path.join(__dirname, 'backup', 'history.json');
  if (!fs.existsSync(p)) return res.json([]);
  try{ res.json(JSON.parse(fs.readFileSync(p, 'utf8'))); }catch(e){ res.json([]); }
});

app.get('/api/verify', (req, res) => {
  const { hash } = req.query;
  const permPath = path.join(__dirname, 'permanent', 'permanent.json');
  if (!fs.existsSync(permPath)) return res.json({ ok: true, first: true });
  try{
    const perm = JSON.parse(fs.readFileSync(permPath, 'utf8'));
    const saved = perm.hash || perm.permanent_hash;
    res.json({ ok: saved === hash, match: saved === hash, backupHash: hash, permanentHash: saved });
  }catch(e){ res.json({ ok:false, msg:e.message }); }
});

app.post('/api/project-info', (req, res) => {
  console.log('Project:', req.body);
  res.json({ ok:true });
});

app.get('/backup/', (req, res) => {
  const p = path.join(__dirname, 'backup', 'index.html');
  if (fs.existsSync(p)) return res.sendFile(p);
  res.send('<h1>BACKUP LIVE</h1><p>No backup</p>');
});

app.get('/permanent/', (req, res) => {
  const p = path.join(__dirname, 'permanent', 'index.html');
  if (fs.existsSync(p)) return res.sendFile(p);
  res.send('<h1>PERMANENT LIVE</h1><p>NOT CREATED</p>');
});

app.listen(PORT, () => console.log(`✅ FINAL LOCKED at http://127.0.0.1:${PORT}/`));
