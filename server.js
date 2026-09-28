const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=3000;
const BACKUP_DIR=path.join(__dirname,'backup');
const PERM_DIR=path.join(__dirname,'permanent');
const HISTORY_FILE=path.join(BACKUP_DIR,'history.json');
if(!fs.existsSync(BACKUP_DIR))fs.mkdirSync(BACKUP_DIR,{recursive:true});
if(!fs.existsSync(PERM_DIR))fs.mkdirSync(PERM_DIR,{recursive:true});
if(!fs.existsSync(HISTORY_FILE))fs.writeFileSync(HISTORY_FILE,'[]');

function hashData(d){return crypto.createHash('sha256').update(d).digest('hex').toUpperCase().slice(0,16);}
function getHistory(){try{return JSON.parse(fs.readFileSync(HISTORY_FILE,'utf8'))}catch{return []}}
function saveHistory(h){fs.writeFileSync(HISTORY_FILE,JSON.stringify(h,null,2))}

const server=http.createServer((req,res)=>{
  // CORS
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}

  // API: SECURE BACKUP - TERMUX → BACKUP ✅
  if(req.url==='/api/backup' && req.method==='POST'){
    let body='';req.on('data',c=>body+=c);req.on('end',()=>{
      const data=body||'SUROKKHA-X-'+Date.now();
      const h=hashData(data);
      const entry={id:Date.now(),hash:h,time:new Date().toISOString(),data:data.slice(0,100)};
      const hist=getHistory();hist.unshift(entry);saveHistory(hist);
      fs.writeFileSync(path.join(BACKUP_DIR,`${h}.json`),JSON.stringify(entry,null,2));
      fs.writeFileSync(path.join(BACKUP_DIR,'index.html'),`<h1>Backup Live</h1><p>Hash: ${h}</p><p>Time: ${entry.time}</p><pre>${JSON.stringify(hist.slice(0,5),null,2)}</pre>`);
      res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,hash:h,msg:'SECURE BACKUP DONE → HISTORY → BACKUP LIVE'}));
    });return;
  }

  // API: HISTORY
  if(req.url==='/api/history'){
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(getHistory()));return;
  }

  // API: VERIFY HASH → Backup ↔ Permanent
  if(req.url.startsWith('/api/verify')){
    const url=new URL(req.url,'http://localhost');const h=url.searchParams.get('hash');
    const permHash=fs.existsSync(path.join(PERM_DIR,'permanent.json'))?JSON.parse(fs.readFileSync(path.join(PERM_DIR,'permanent.json'))).hash:null;
    if(!permHash){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,first:true,msg:'First Permanent — Verification OK'}));return;}
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:h===permHash,backup:h,permanent:permHash,match:h===permHash}));return;
  }

  // API: CONFIRM PERMANENT - TERMUX → PERMANENT ❌ | SUROKKHA → VERIFY → USER CONFIRM → PERMANENT ✅
  if(req.url==='/api/permanent' && req.method==='POST'){
    // Security: Block direct TERMUX without verify
    const origin=req.headers['x-surokkha-confirm'];
    if(origin!=='USER_CONFIRMED'){
      res.writeHead(403,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,msg:'SECURITY RULE: TERMUX → PERMANENT ❌ — Need SUROKKHA VERIFY → USER CONFIRM'}));return;
    }
    let body='';req.on('data',c=>body+=c);req.on('end',()=>{
      try{
        const {hash}=JSON.parse(body);const hist=getHistory();const found=hist.find(x=>x.hash===hash);
        if(!found){res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,msg:'Checkpoint not found'}));return;}
        // Permanent Hash Auto-Created by System
        const perm={hash:found.hash,time:new Date().toISOString(),source:found,autoCreated:true};
        fs.writeFileSync(path.join(PERM_DIR,'permanent.json'),JSON.stringify(perm,null,2));
        fs.writeFileSync(path.join(PERM_DIR,'index.html'),`<h1>Permanent Live - Separate URL</h1><p>Permanent Hash (Auto-Created): ${found.hash}</p><p>Time: ${perm.time}</p><p>✅ VERIFIED → PERMANENT SAVE → AUTO DEPLOYMENT → PERMANENT LIVE</p>`);
        res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,permanent:perm,msg:'PERMANENT SAVE → AUTO DEPLOYMENT → PERMANENT LIVE'}));
      }catch(e){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,msg:e.message}))}
    });return;
  }

  // Static files
  let filePath=path.join(__dirname, req.url==='/'?'/index.html':req.url);
  if(fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath=path.join(filePath,'index.html');
  fs.readFile(filePath,(err,data)=>{
    if(err){
      if(fs.existsSync(path.join(__dirname,'404.html'))){res.writeHead(200,{'Content-Type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'404.html')));}else{res.writeHead(404);res.end('404');}
      return;
    }
    const ext=path.extname(filePath);const mime={'.html':'text/html','.json':'application/json','.js':'text/javascript'}[ext]||'text/html';
    res.writeHead(200,{'Content-Type':mime});res.end(data);
  });
});
server.listen(PORT,()=>console.log(`✅ FINAL BACKEND LIVE at http://127.0.0.1:${PORT}/\n01 BACKUP ✅\n02 HISTORY+HASH ✅\n03 LIVE BUTTONS (Separate URL) ✅\n04 LOCK ✅\n05 PERMANENT (Checkpoint+Confirm) ✅\n06 VERIFY HASH (Auto Permanent Hash) ✅`));
