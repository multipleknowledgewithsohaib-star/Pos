#!/bin/bash
# ============================================================
# DATA RECOVERY CHECK — VPS par chalao
# Yeh check karega ke data abhi bhi hai ya nahi
# ============================================================

OLD_DB="/var/www/rayyantraders.solutionir.com/prisma/dev.db"
NEW_DB="/var/data/rayyantraders/pharma.db"

echo "=== DATABASE RECOVERY CHECK ==="
echo ""

# Check old location
if [ -f "$OLD_DB" ]; then
  SIZE=$(du -h "$OLD_DB" | cut -f1)
  echo "[FOUND] Purani database: $OLD_DB (Size: $SIZE)"

  # Check if it has data
  PRODUCTS=$(sqlite3 "$OLD_DB" "SELECT COUNT(*) FROM Product;" 2>/dev/null || echo "0")
  BATCHES=$(sqlite3 "$OLD_DB" "SELECT COUNT(*) FROM Batch;" 2>/dev/null || echo "0")
  MOVEMENTS=$(sqlite3 "$OLD_DB" "SELECT COUNT(*) FROM StockMovement;" 2>/dev/null || echo "0")

  echo ""
  echo "  Products:      $PRODUCTS"
  echo "  Batches:       $BATCHES"
  echo "  Stock Movements: $MOVEMENTS"
  echo ""

  if [ "$PRODUCTS" -gt 0 ] 2>/dev/null; then
    echo "DATA MILA! Recover karne ke liye:"
    echo ""
    echo "  mkdir -p /var/data/rayyantraders"
    echo "  cp $OLD_DB $NEW_DB"
    echo "  echo 'Recovery mukammal!'"
    echo ""
    echo "Phir .env.production mein DATABASE_URL update karo:"
    echo '  DATABASE_URL="file:/var/data/rayyantraders/pharma.db"'
  else
    echo "Database khali hai — data recover nahi ho sakta."
    echo "Fresh start karni hogi."
  fi
else
  echo "[NOT FOUND] $OLD_DB nahi mili."
  echo "Data permanently lost ho gaya hai."
  echo ""
  echo "Ab naya setup karo:"
  echo "  bash /var/www/rayyantraders.solutionir.com/scripts/vps-setup.sh"
fi

echo ""
echo "==================================="
