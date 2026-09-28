const express=require('express');const fs=require('fs');const path=require('path');const multer=require('multer');const crypto=require('crypto');const app=express();const PORT=3000;
app.use(express.json());
app.use((req,res,next)=>{res.header('Access-Control-Allow-Origin','*');res.header('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.header('Access-Control-Allow-Headers','Content-Type');if(req.method==='OPTIONS')return res.sendStatus(200);next()});
const backupDir=path.join(__dirname,'backup');const permDir=path.join(__dirname,'permanent');const publicDir=path.join(__dirname,'public');[backupDir,permDir].forEach(d=>{if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true})});
const lockFile=path.join(__dirname,'lock.json');function getLock(){try{return JSON.parse(fs.readFileSync(lockFile,'utf8')).locked}catch(e){return true}}function setLock(v){fs.writeFileSync(lockFile,JSON.stringify({locked:v}))}
function hashFile(p){try{return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}catch(e){return '-'}}
function getHistory(){try{const walk=(dir,base='')=>{let res=[];for(const f of fs.readdirSync(dir)){const full=path.join(dir,f);const rel=path.join(base,f);const stat=fs.statSync(full);if(stat.isDirectory())res=res.concat(walk(full,rel));else res.push({name:rel,full,mtime:stat.mtime,size:stat.size})}return res};return walk(backupDir).map(o=>({name:o.name,hash:hashFile(o.full),time:new Date(o.mtime).toLocaleString(),size:o.size})).sort((a,b)=>b.time.localeCompare(a.time))}catch(e){return[]}}
function getPerm(){try{const files=fs.readdirSync(permDir).filter(f=>{try{return fs.statSync(path.join(permDir,f)).isFile()}catch{return false}});if(!files.length)return null;const latest=files.map(n=>({name:n,path:path.join(permDir,n),mtime:fs.statSync(path.join(permDir,n)).mtime})).sort((a,b)=>b.mtime-a.mtime)[0];return{...latest,hash:hashFile(latest.path)}}catch(e){return null}}
function listHTML(dir,urlPrefix,title){let files=[];try{const walk=(d,b='')=>{for(const f of fs.readdirSync(d)){const full=path.join(d,f);const rel=path.join(b,f);const stat=fs.statSync(full);if(stat.isDirectory())walk(full,rel);else files.push({rel,size:stat.size,time:stat.mtime})}};walk(dir)}catch(e){}let html=`<h1>${title} LIVE - www.projectsurokkhax.com</h1><p>Count: ${files.length} | <a href="/">Dashboard</a></p><hr><ul>`;files.forEach(f=>{html+=`<li><a href="${urlPrefix}/${encodeURIComponent(f.rel)}">${f.rel}</a> - ${f.size} bytes - ${new Date(f.time).toLocaleString()}</li>`});html+='</ul>';if(!files.length)html+='<p>No files yet - Backup from Dashboard, then it will appear here LIVE</p>';return html}
const upload=multer({dest:path.join(__dirname,'tmp')});
app.get('/api/status',(req,res)=>{const h=getHistory();const p=getPerm();res.json({locked:getLock(),count:h.length,permanentCreated:!!p})});
app.get('/api/history',(req,res)=>res.json(getHistory()));
app.get('/api/permanent',(req,res)=>{const p=getPerm();if(!p)return res.json({hash:null,message:'NOT CREATED - Hash - is normal'});res.json(p)});
app.post('/api/backup',upload.single('file'),(req,res)=>{if(getLock()){if(req.file)fs.unlinkSync(req.file.path);return res.status(423).json({error:'LOCKED'})}if(!req.file)return res.status(400).json({error:'No file'});const dest=path.join(backupDir,req.file.originalname);fs.renameSync(req.file.path,dest);res.json({message:`BACKUP OK`,hash:hashFile(dest),name:req.file.originalname})});
app.post('/api/lock',(req,res)=>{setLock(true);res.json({locked:true})});
app.post('/api/unlock',(req,res)=>{setLock(false);res.json({locked:false})});
app.get('/api/verify',(req,res)=>{const h=getHistory();const p=getPerm();if(!h.length)return res.json({match:false,message:'No backup'});if(!p)return res.json({match:false,backupHash:h[0].hash,permanentHash:'-',message:'Permanent NOT CREATED - Hash - is normal'});res.json({match:h[0].hash===p.hash,backupHash:h[0].hash,permanentHash:p.hash,message:h[0].hash===p.hash?'MATCHED ✅':'MISMATCH ❌'})});
app.post('/api/confirm-permanent',(req,res)=>{const {name}=req.body;if(!name)return res.status(400).json({error:'Select checkpoint'});const src=path.join(backupDir,name);const src2=fs.existsSync(src)?src:(()=>{let found=null;const walk=(d)=>{for(const f of fs.readdirSync(d)){const full=path.join(d,f);if(fs.statSync(full).isDirectory())walk(full);else if(f===name||full.endsWith(name))found=full}};try{walk(backupDir)}catch{};return found})();if(!src2||!fs.existsSync(src2))return res.status(404).json({error:'Not found'});const dest=path.join(permDir,path.basename(name));fs.copyFileSync(src2,dest);res.json({message:`PERMANENT CONFIRMED ✅`,hash:hashFile(dest),name:path.basename(name)})});
app.get('/backup', (req,res)=>{res.send(listHTML(backupDir,'/backup','BACKUP'))});
app.get('/backup/', (req,res)=>{res.send(listHTML(backupDir,'/backup','BACKUP'))});
app.get('/permanent', (req,res)=>{res.send(listHTML(permDir,'/permanent','PERMANENT'))});
app.get('/permanent/', (req,res)=>{res.send(listHTML(permDir,'/permanent','PERMANENT'))});
app.use('/backup',express.static(backupDir));
app.use('/permanent',express.static(permDir));
app.use(express.static(publicDir));
app.get('/',(req,res)=>res.sendFile(path.join(publicDir,'index.html')));
app.listen(PORT,'0.0.0.0',()=>console.log(`RUNNING http://0.0.0.0:3000 PERM ${getLock()?'LOCKED':'UNLOCKED'} SECURE CORS ON ✅ LIVE FIXED`));

// Vercel Export
if (require.main !== module) { module.exports = require('./server.js'); } else {}

// VERCEL FIX - Auto
if (process.env.VERCEL) {
  module.exports = module.exports || require('express')();
}
