export default function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.json({real:['roof','proyojon-x','projectsurokkha-x','surokkha-x','backup','dailyamarhisab-x'],message:'এগুলোই আসল প্রজেক্ট'});
}
