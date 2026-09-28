const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// CORS + Security
app.use((req,res,next)=>{res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');if(req.method==='OPTIONS')return res.sendStatus(200);next();});
app.use(express.json());

const ROOT = path.join(__dirname,'..');

// Serve backup/permanent
app.use('/backup', express.static(path.join(ROOT,'backup')));
app.use('/permanent', express.static(path.join(ROOT,'permanent')));

// API mock for Vercel (Local এ আসল server.js কাজ করবে)
app.get('/api/status',(req,res)=>res.json({locked:true,count:1,permanentCreated:false}));
app.get('/api/history',(req,res)=>res.json([]));
app.get('/api/permanent',(req,res)=>res.json({}));

// Main page
app.get('/', (req,res)=>{
  const p = path.join(ROOT,'index.html');
  if(fs.existsSync(p)) return res.sendFile(p);
  // fallback - তোমার dashboard
  return res.send(`<!DOCTYPE html><html><head><title>www.projectsurokkhax.com - 3D SECURE VAULT</title></head><body style="background:#080808;color:#fff;font-family:monospace;text-align:center;padding:40px"><h1>🔐 PROJECT <span style="color:#00ff88">SUROKKHA-X</span></h1><p>www.projectsurokkhax.com<br>3D SECURE VAULT</p><p style="color:#00ff88">LIVE ON VERCEL ✅</p><a href="/backup/" style="color:#00ff88">Backup</a> | <a href="/permanent/" style="color:#a855f7">Permanent</a></body></html>`);
});

app.get('/(.*)', (req,res)=>{
  const filePath = path.join(ROOT, req.path);
  if(fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return res.sendFile(filePath);
  res.redirect('/');
});

module.exports = app;
