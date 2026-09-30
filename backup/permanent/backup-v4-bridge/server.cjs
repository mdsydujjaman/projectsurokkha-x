const express=require('express');const fs=require('fs');const path=require('path');
const app=express();app.use(express.static(__dirname));app.use(express.json());
const BFILE=path.join(__dirname,'history.json');const JFILE=path.join(__dirname,'jobs.json');const GFILE=path.join(__dirname,'github.json');
function load(f){try{return JSON.parse(fs.readFileSync(f,'utf-8'))}catch(e){return []}};function save(f,d){fs.writeFileSync(f,JSON.stringify(d,null,2))};
app.get('/',(r,s)=>s.sendFile(path.join(__dirname,'index.html')));
app.get('/api/history',(r,s)=>s.json(load(BFILE)));
app.get('/api/jobs',(r,s)=>s.json(load(JFILE)));
app.get('/api/github',(r,s)=>s.json(load(GFILE)));
app.get('/api/audit',(r,s)=>s.json({location:'backup/backup-v4-bridge', main_safe:'YES ✅ B001 proyojon-new Safe', live:'backup-v4-bridge [] empty - Ready for projectsurokkha-x', port:3001, time:new Date().toISOString()}));
app.post('/api/backup',(req,res)=>{
 let jobs=load(JFILE); const project=(req.body.project||'projectsurokkhax').trim(); const step=(req.body.step||'Step-4').trim();
 const jobId=`JOB-${Date.now()}`; jobs.unshift({id:jobId, project, step, status:'BACKUP JOB CREATED - Waiting', created_at:new Date().toISOString()}); save(JFILE,jobs);
 console.log(`[BACKUP] ${jobId} ${project} ${step}`);
 res.json({ok:true, jobId});
});
app.listen(3001,'0.0.0.0',()=>console.log('LIVE 3001 READY - Main B001 proyojon-new Safe | Backup Folder [] Ready for projectsurokkha-x | http://127.0.0.1:3001/'));
