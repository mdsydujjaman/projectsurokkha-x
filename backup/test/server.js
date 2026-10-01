const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(express.json({limit:'10mb'}));
app.use(express.static(__dirname));

const HOME = process.env.HOME || '/data/data/com.termux/files/home';

function getAllProjects(){
  try{
    return fs.readdirSync(HOME).filter(f=>{
      try{
        const full=path.join(HOME,f);
        return fs.statSync(full).isDirectory() && !f.startsWith('.') && f!=='backup' && !f.includes('node_modules');
      }catch{return false}
    });
  }catch{return ["projectsurokkha-x"];}
}

function getStepsForProject(projName){
  try{
    // 1. ~/projectName এর ভিতরে step আছে কিনা
    const p1 = path.join(HOME, projName);
    let steps1 = [];
    try{ steps1 = fs.readdirSync(p1).filter(f=>fs.statSync(path.join(p1,f)).isDirectory()); }catch{}
    
    // 2. backup/test/PROJECTNAME এর ভিতরে step আছে কিনা (তোমার বর্তমান system)
    const p2 = path.join(__dirname, projName.toUpperCase());
    let steps2 = [];
    try{ steps2 = fs.readdirSync(p2).filter(f=>fs.statSync(path.join(p2,f)).isDirectory()); }catch{}
    
    return [...new Set([...steps1, ...steps2])];
  }catch{return [];}
}

function findAutoMatch(input){
  if(!input) return "projectsurokkha-x";
  const all = getAllProjects();
  const ci = input.toLowerCase().replace(/[^a-z0-9]/g,'');
  let f = all.find(p=>p.toLowerCase()===input.toLowerCase());
  if(f) return f;
  f = all.find(p=>{
    const cp = p.toLowerCase().replace(/[^a-z0-9]/g,'');
    return cp.includes(ci) || ci.includes(cp);
  });
  return f || "projectsurokkha-x";
}

app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'dashboard.html')));
app.get('/backup',(req,res)=>res.sendFile(path.join(__dirname,'dashboard.html')));
app.get('/backup/',(req,res)=>res.sendFile(path.join(__dirname,'dashboard.html')));
app.get('/api/projects',(req,res)=>res.json({projects:getAllProjects()}));
app.get('/api/steps/:project',(req,res)=>{
  const proj = req.params.project;
  const matched = findAutoMatch(proj);
  res.json({input:proj, matched, steps:getStepsForProject(matched)});
});

app.post('/api/secure-backup',(req,res)=>{
  try{
    let {projectName, projectStep} = req.body;
    
    // 1. Auto Connect Project
    let autoMatched = findAutoMatch(projectName);
    let finalProjectName = autoMatched || projectName || "projectsurokkha-x";
    let cleanName = finalProjectName.toUpperCase();
    
    // 2. Step Logic - থাকলে দিবে, না থাকলে দিবে না
    let existingSteps = getStepsForProject(finalProjectName);
    let finalStep = null;
    let targetDir;
    
    if(projectStep && projectStep.trim()!==""){
      // Step দিয়েছে
      let cleanStep = projectStep.replace(/[^a-zA-Z0-9-_]/g,'-').toUpperCase();
      // Step আগে আছে কিনা চেক করবে, থাকলেও ওটাতেই যাবে, না থাকলে নতুন বানাবে
      let stepExists = existingSteps.some(s=>s.toUpperCase()===cleanStep);
      console.log(`📁 Steps for ${finalProjectName}:`, existingSteps, ` | Input Step: ${cleanStep} | Exists: ${stepExists}`);
      finalStep = cleanStep;
      targetDir = path.join(__dirname, cleanName, finalStep);
    } else {
      // Step দেয়নি - শুধু Project এ Backup
      console.log(`📁 No Step given - Backup to Project root only: ${finalProjectName}`);
      targetDir = path.join(__dirname, cleanName);
    }
    
    fs.mkdirSync(targetDir,{recursive:true});
    
    let info={
      inputName: projectName,
      inputStep: projectStep || "(no step)",
      autoMatched,
      finalProjectName,
      finalStep: finalStep || "(root only)",
      existingSteps,
      time: new Date().toISOString(),
      targetDir
    };
    
    fs.writeFileSync(path.join(targetDir,'info.json'), JSON.stringify(info,null,2));
    fs.writeFileSync(path.join(__dirname,'last-connect.json'), JSON.stringify(info,null,2));
    fs.writeFileSync(path.join(__dirname,'project-info.json'), JSON.stringify({name:finalProjectName, step:finalStep, inputName:projectName},null,2));
    
    console.log(`✅ SECURE BACKUP NOW: ${projectName} (${projectStep||'no step'}) -> ${finalProjectName} (${finalStep||'root'}) [AUTO CONNECTED]`);
    res.json({ok:true, autoConnected:true, info});
  }catch(e){
    console.log(e);
    res.status(500).json({ok:false, error:e.message});
  }
});

app.listen(3000,()=>console.log('FINAL AUTO CONNECT V4 - Project + Optional Step - Server 3000'));
