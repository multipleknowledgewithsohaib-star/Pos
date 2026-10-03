#!/bin/bash
# ============================================================
# VPS FIRST-TIME SETUP SCRIPT — Sirf ek dafa chalao
# Pharmacy POS — rayyantraders.solutionir.com
# ============================================================

APP_DIR="/var/www/rayyantraders.solutionir.com"
DATA_DIR="/var/data/rayyantraders"   # Database yahan safe rahegi (deploy par safe)

echo "=== Pharma POS VPS Setup ==="

# 1. Persistent data folder banao (project se bahar)
mkdir -p $DATA_DIR
chmod 755 $DATA_DIR

# 2. Pehli dafa: database schema banao
if [ ! -f "$DATA_DIR/pharma.db" ]; then
  echo "Naya database bana raha hai: $DATA_DIR/pharma.db ..."
  cd $APP_DIR
  DATABASE_URL="file:$DATA_DIR/pharma.db" npx prisma migrate deploy
  echo "Database ban gaya!"
else
  echo "Database pehle se exist karti hai — data safe hai."
fi

# 3. .env.production file banao
cat > $APP_DIR/.env.production << EOF
DATABASE_URL="file:/var/data/rayyantraders/pharma.db"
STORE_PATH="/var/data/rayyantraders/pharma-store.json"
NODE_ENV=production
EOF

echo ""
echo "=== Setup Mukammal! ==="
echo "Database: $DATA_DIR/pharma.db"
echo "Ab chalao: npm run build && pm2 restart pharma"
