#!/bin/bash
# VPS emergency fix — run: bash scripts/vps-emergency-fix.sh
set -e
cd "$(dirname "$0")/.."

echo "=== Emergency VPS fix ==="
echo "Folder: $(pwd)"

if [ ! -f package.json ]; then
  echo "ERROR: package.json not found."
  exit 1
fi

if [ -d app/app ]; then
  if [ -d app/modules ] || [ -d "app/(console)" ]; then
    echo "Duplicate app/app found — removing..."
    rm -rf app/app
  else
    echo "Project nested in app/app — moving up..."
    shopt -s dotglob nullglob
    for item in app/app/*; do
      name="$(basename "$item")"
      if [ ! -e "app/$name" ]; then
        mv "$item" "app/$name"
        echo "Moved app/app/$name -> app/$name"
      fi
    done
    rm -rf app/app
  fi
fi

mkdir -p app/2fa
cat > app/2fa/page.tsx << 'EOF'
import { redirect } from 'next/navigation';

export default function TwoFactorAliasPage() {
  redirect('/modules/two-factor');
}
EOF

echo ""
echo "Check:"
ls app/modules >/dev/null 2>&1 && echo "  app/modules OK" || echo "  app/modules MISSING"
ls "app/(console)" >/dev/null 2>&1 && echo "  app/(console) OK" || echo "  app/(console) MISSING"
[ -d app/app ] && echo "  app/app STILL EXISTS — problem!" || echo "  app/app removed OK"
echo ""
echo "Now run: npm run build"
