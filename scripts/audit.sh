#!/usr/bin/env bash
set -euo pipefail

ROOT="apps/web"
echo "== Audit: $ROOT =="

# 1) Базовые файлы App Router
test -f "$ROOT/app/layout.tsx" || { echo "❌ Нет app/layout.tsx"; exit 1; }
test -f "$ROOT/app/page.tsx"   || { echo "❌ Нет app/page.tsx"; exit 1; }

# 2) Корректный not-found и отсутствие legacy /404
if [ -d "$ROOT/app/404" ] || [ -f "$ROOT/app/404/page.tsx" ]; then
  echo "❌ Удали pages /404 (в App Router нужен not-found.tsx)"; exit 1;
fi
test -f "$ROOT/app/not-found.tsx" || echo "⚠️  Нет app/not-found.tsx (не критично)"

# 3) Запрещённые хуки поиска урла (частая причина падения билда)
FOUND=0
grep -R --line-number "useSearchParams(" "$ROOT" && FOUND=1 || true
grep -R --line-number "usePathname("    "$ROOT" && FOUND=1 || true
if [ $FOUND -eq 1 ]; then
  echo "⚠️  Нашлись useSearchParams/usePathname — оберни компонент в <Suspense> и пометь 'use client'"
fi

# 4) Алиас @/*
if ! grep -q '"paths": { "@/*":' "$ROOT/tsconfig.json"; then
  echo "⚠️  В tsconfig.json нет alias '@/'. Добавь: \"baseUrl\": \".\", \"paths\": { \"@/*\": [\"./*\"] }"
else
  echo "✅ tsconfig alias @/* настроен"
fi

# 5) Наличие BFF-роута и импорта из lib
test -f "$ROOT/app/api/bff/visa-and-plan/route.ts" || { echo "❌ Нет BFF /api/bff/visa-and-plan"; exit 1; }
echo "✅ BFF найден"

# 6) Сборка
( cd "$ROOT" && npm ci && npm run build )
echo "✅ Build OK"

echo "== Audit done =="
