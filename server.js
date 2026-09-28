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
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Surokkha-Confirm');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  if(req.url==='/api/backup' && req.method==='POST'){
    let body='';req.on('data',c=>body+=c);req.on('end',()=>{
      const data=body||'SUROKKHA-X-'+Date.now();const h=hashData(data);
      const entry={id:Date.now(),hash:h,time:new Date().toISOString(),data:data.slice(0,100)};
      const hist=getHistory();hist.unshift(entry);saveHistory(hist);
      fs.writeFileSync(path.join(BACKUP_DIR,`${h}.json`),JSON.stringify(entry,null,2));
      fs.writeFileSync(path.join(BACKUP_DIR,'index.html'),`<h1>Backup Live (Test URL - Placeholder)</h1><p>Hash: ${h}</p><p>${entry.time}</p>`);
      res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,hash:h}));
    });return;
  }
  if(req.url==='/api/history'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(getHistory()));return;}
  if(req.url.startsWith('/api/verify')){
    const url=new URL(req.url,'http://localhost');const h=url.searchParams.get('hash');
    const permPath=path.join(PERM_DIR,'permanent.json');
    const permHash=fs.existsSync(permPath)?JSON.parse(fs.readFileSync(permPath)).hash:null;
    if(!permHash){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,first:true,msg:'First Permanent — Verification OK — Permanent Hash: -'}));return;}
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:h===permHash,backup:h,permanent:permHash,match:h===permHash}));return;
  }
  if(req.url==='/api/permanent' && req.method==='POST'){
    const origin=req.headers['x-surokkha-confirm'];
    if(origin!=='USER_CONFIRMED'){res.writeHead(403,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,msg:'SECURITY: TERMUX → PERMANENT ❌'}));return;}
    let body='';req.on('data',c=>body+=c);req.on('end',()=>{
      try{
        const {hash}=JSON.parse(body);const hist=getHistory();const found=hist.find(x=>x.hash===hash);
        if(!found){res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,msg:'Checkpoint not found'}));return;}
        const perm={hash:found.hash,time:new Date().toISOString(),source:found,autoCreated:true};
        fs.writeFileSync(path.join(PERM_DIR,'permanent.json'),JSON.stringify(perm,null,2));
        fs.writeFileSync(path.join(PERM_DIR,'index.html'),`<h1>Permanent Live (Project URL - Placeholder)</h1><p>Auto Hash: ${found.hash}</p><p>${perm.time}</p><p>VERIFY=PASS → USER CONFIRM → PERMANENT SAVE → AUTO DEPLOY (backend auto)</p>`);
        console.log(`🚀 AUTO DEPLOY (backend auto): ${found.hash} → PERMANENT LIVE`);
        res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,permanent:perm}));
      }catch(e){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,msg:e.message}))}
    });return;
  }
  let filePath=path.join(__dirname, req.url==='/'?'/index.html':req.url);
  if(fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath=path.join(filePath,'index.html');
  fs.readFile(filePath,(err,data)=>{
    if(err){if(fs.existsSync(path.join(__dirname,'404.html'))){res.writeHead(200,{'Content-Type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'404.html')));}else{res.writeHead(404);res.end('404');}return;}
    const ext=path.extname(filePath);const mime={'.html':'text/html','.json':'application/json'}[ext]||'text/html';
    res.writeHead(200,{'Content-Type':mime});res.end(data);
  });
});
server.listen(PORT,()=>console.log(`✅ FINAL V2 LOCKED — CORRECTED LIVE at http://127.0.0.1:${PORT}/`));
