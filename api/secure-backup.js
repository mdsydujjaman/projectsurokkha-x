export default function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  const real = ['roof','proyojon-x','projectsurokkha-x','surokkha-x','backup','dailyamarhisab-x','test'];
  const raw = (req.body?.project||req.body?.projectName||'').trim();
  if(!raw) return res.json({success:false,message:'Project name দাও!'});
  const exists = real.some(p=>raw.toLowerCase().includes(p) || p.includes(raw.toLowerCase()));
  if(!exists) return res.json({success:false,message:`❌ '${raw}' নামে কোন প্রজেক্ট নাই! আসল প্রজেক্ট: ${real.join(', ')}`});
  return res.json({success:true,message:`Successfully connected: ${raw}`,entry:{project:raw,step:req.body.step||'no-step',time:new Date().toLocaleString()}});
}
