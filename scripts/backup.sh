#!/bin/bash
# ============================================================
# DATABASE BACKUP SCRIPT — Roz rat 2 baje chalao (auto)
# Pharmacy POS — rayyantraders.solutionir.com
# ============================================================

DATA_DIR="/var/data/rayyantraders"
BACKUP_DIR="/var/backups/rayyantraders"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database copy karo timestamp ke saath
cp "$DATA_DIR/pharma.db" "$BACKUP_DIR/pharma_$DATE.db"

# Sirf last 30 backups rakho (purane delete ho jayenge)
ls -t $BACKUP_DIR/*.db | tail -n +31 | xargs -r rm

echo "[$(date)] Backup saved: $BACKUP_DIR/pharma_$DATE.db"

# -----------------------------------------------
# CRON SETUP (sirf ek dafa run karo):
#   crontab -e
#   Yeh line add karo:
#   0 2 * * * /var/www/rayyantraders.solutionir.com/scripts/backup.sh >> /var/log/pharma-backup.log 2>&1
# -----------------------------------------------
