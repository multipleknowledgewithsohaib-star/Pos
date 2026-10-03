#!/bin/bash
# ============================================================
# VPS DEPLOY SCRIPT — Har update par chalao
# Pharmacy POS — rayyantraders.solutionir.com
# Database SAFE rahegi — delete nahi hogi
# ============================================================

APP_DIR="/var/www/rayyantraders.solutionir.com"
DATA_DIR="/var/data/rayyantraders"

echo "=== Pharma POS Deploy Start ==="
echo "App:      $APP_DIR"
echo "Database: $DATA_DIR/pharma.db"
echo ""

cd $APP_DIR

# 1. Latest code pull karo
echo "[1/5] Code pull kar raha hai..."
git pull origin main

# 2. Dependencies install karo
echo "[2/5] Dependencies install ho rahi hain..."
npm install

# 3. Database migrations (data delete nahi hoga, sirf schema update)
echo "[3/5] Database migrations chal rahi hain..."
DATABASE_URL="file:$DATA_DIR/pharma.db" npx prisma migrate deploy

# 4. App build karo
echo "[4/5] App build ho rahi hai..."
DATABASE_URL="file:$DATA_DIR/pharma.db" npm run build

# 5. PM2 se restart karo
echo "[5/5] App restart ho rahi hai..."
pm2 restart pharma --update-env

echo ""
echo "=== Deploy Mukammal! ==="
echo "Site: https://rayyantraders.solutionir.com"
echo "Database: $DATA_DIR/pharma.db (SAFE)"
