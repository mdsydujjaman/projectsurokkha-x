#!/data/data/com.termux/files/usr/bin/bash
cd ~/projectsurokkha-x
pkill -9 node
nohup node server.js > server.log 2>&1 &
echo "RUNNING http://127.0.0.1:3000 ✅"
