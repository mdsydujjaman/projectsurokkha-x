#!/data/data/com.termux/files/usr/bin/bash
PROJECT="X"
STEP="02"
FILE=$1
if [ -z "$FILE" ]; then echo "Use: ./connect.sh file.html"; exit 1; fi
COUNT=$(ls backup/$PROJECT/Step-$STEP/ 2>/dev/null | wc -l)
NEXT=$((COUNT/2 + 1))
B=$(printf "%03d" $NEXT)
CHECKPOINT="${PROJECT}-S${STEP}-B${B}"
echo "🔒 Backup: $CHECKPOINT"
curl -s -X POST http://localhost:3000/api/backup -H "Content-Type: application/json" -d "{\"project\":\"$PROJECT\",\"step\":\"$STEP\",\"checkpoint\":\"$CHECKPOINT\",\"code\":$(cat "$FILE" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}"
echo ""
echo "✅ Done: $CHECKPOINT"
