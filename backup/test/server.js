const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.text({type:'*/*'}));
app.use(express.static(__dirname));

app.post('/api/backup', (req,res)=>{
  try{
    const dir = path.join(__dirname, 'backups');
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir, Date.now()+'.txt'), req.body||'');
    res.json({ok:true});
  }catch(e){res.json({ok:false})}
});
app.post('/api/project-info', (req,res)=>{
  try{
    fs.writeFileSync(path.join(__dirname,'project-info.json'), JSON.stringify(req.body,null,2));
    res.json({ok:true});
  }catch(e){res.json({ok:false})}
});
app.post('/api/secure-backup', (req,res)=>{
  try{
    const {projectName,projectStep,hash,checkpoint}=req.body;
    if(!projectName||!projectStep) return res.json({ok:false});
    const cleanName=projectName.replace(/[^a-zA-Z0-9-_]/g,'-');
    const cleanStep=projectStep.replace(/[^a-zA-Z0-9-_]/g,'-');
    const targetDir=path.join(__dirname,cleanName,cleanStep);
    fs.mkdirSync(targetDir,{recursive:true});
    const info={projectName:cleanName,projectStep:cleanStep,hash,checkpoint,created:new Date().toISOString(),termuxPath:`~/projectsurokkha-x/backup/test/${cleanName}/${cleanStep}`,fullPath:targetDir};
    fs.writeFileSync(path.join(targetDir,'info.json'), JSON.stringify(info,null,2));
    fs.writeFileSync(path.join(__dirname,'last-connect.json'), JSON.stringify(info,null,2));
    console.log(`✅ Auto Connected: ${cleanName}/${cleanStep} | ${checkpoint}`);
    res.json({ok:true,info});
  }catch(e){res.json({ok:false,msg:e.message})}
});
const PORT=3000;
app.listen(PORT,()=>console.log(`SUROKKHA-X Auto Connect running on ${PORT}`));
