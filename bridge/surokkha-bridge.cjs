const fs=require('fs');const SUROKKHA_URL='http://127.0.0.1:3001';const BRIDGE_TOKEN='SUROKKHA_BRIDGE_2026_SECURE';
const ROOTS=[process.env.HOME+'/proyojon-new', process.env.HOME+'/projectsurokkhax'];
async function poll(){
 try{
  let r=await fetch(`${SUROKKHA_URL}/api/bridge/jobs?token=${BRIDGE_TOKEN}`);let jobs=await r.json();
  if(!jobs.length){console.log('[Backup Bridge] Heartbeat - Main Safe - No jobs');return;}
  for(let job of jobs){
   console.log(`[Backup Bridge] Found Job ${job.id} ${job.project} ${job.step}`);
   let files=[];for(let root of ROOTS){try{files=files.concat(fs.readdirSync(root).filter(f=>!f.startsWith('.')).slice(0,8));}catch(e){}}
   let res=await fetch(`${SUROKKHA_URL}/api/bridge/submit`,{method:'POST',headers:{'Content-Type':'application/json','x-bridge-token':BRIDGE_TOKEN},body:JSON.stringify({jobId:job.id, project:job.project, step:job.step, files})});
   let out=await res.json();console.log(`[Backup Bridge] Done in Backup Folder: ${out.backupId} ${out.backupHash} | Main Safe`);
  }
 }catch(e){console.log('[Backup Bridge] Offline:',e.message);}
}
console.log('🔐 BACKUP FOLDER BRIDGE STARTED Port 3001 - Main projectsurokkha-x SAFE');
setInterval(poll,3000);poll();
