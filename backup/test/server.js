const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(express.json({limit:'10mb'}));
app.use(express.text({type:'text/plain'}));
app.use(express.static(__dirname));
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'dashboard.html')));
app.get('/backup',(req,res)=>res.sendFile(path.join(__dirname,'dashboard.html')));
app.get('/backup/',(req,res)=>res.sendFile(path.join(__dirname,'dashboard.html')));
app.post('/api/secure-backup',(req,res)=>{
  try{
    let {projectName,projectStep,hash,checkpoint}=req.body;
    let cleanName=(projectName||'default').replace(/[^a-zA-Z0-9-_]/g,'-').toUpperCase();
    let cleanStep=(projectStep||'step').replace(/[^a-zA-Z0-9-_]/g,'-').toUpperCase();
    let targetDir=path.join(__dirname,cleanName,cleanStep);
    fs.mkdirSync(targetDir,{recursive:true});
    let info={projectName,cleanName,projectStep,cleanStep,hash,checkpoint,time:new Date().toISOString(),termuxPath:`~/projectsurokkha-x/backup/test/${cleanName}/${cleanStep}`,fullPath:targetDir};
    fs.writeFileSync(path.join(targetDir,'info.json'),JSON.stringify(info,null,2));
    fs.writeFileSync(path.join(__dirname,'last-connect.json'),JSON.stringify(info,null,2));
    console.log(`✅ Auto Connected: ${cleanName}/${cleanStep} | ${checkpoint}`);
    res.json({ok:true,info});
  }catch(e){res.status(500).json({ok:false,error:e.message})}
});
app.post('/api/backup',(req,res)=>res.json({ok:true}));
app.listen(3000,()=>console.log('FIXED Server running on 3000 - try /backup/ now'));
