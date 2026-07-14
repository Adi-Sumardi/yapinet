#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Deploy backend Yapinet ke Hostinger Business Shared Hosting
#
# Jalankan DI SERVER (lewat SSH/Termius), dari dalam folder backend:
#     cd ~/yapinet/backend && bash deploy.sh
#
# Prasyarat satu kali (lewat hPanel, bukan lewat script ini):
#   1. Subdomain api.yapinet.id dibuat, document root diarahkan ke
#      ~/yapinet/backend/public (BUKAN ke folder backend itu sendiri).
#   2. File .env sudah ada di ~/yapinet/backend (isi dari .env.example,
#      APP_URL=https://api.yapinet.id, FRONTEND_URL=https://yapinet.id,
#      SANCTUM_STATEFUL_DOMAINS=yapinet.id, DB_* sesuai database MySQL
#      yang dibuat di hPanel, GOOGLE_CLIENT_ID/SECRET, dan
#      GOOGLE_REDIRECT_URI=https://api.yapinet.id/api/auth/google/callback
#      — juga didaftarkan sebagai Authorized redirect URI di Google Cloud
#      Console.
#   3. Cron Job hPanel terpasang (sekali saja, bukan tiap deploy):
#        * * * * * php /home/USERNAME/yapinet/backend/artisan schedule:run >> /dev/null 2>&1
#
# Override opsional:
#   BRANCH=main bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BRANCH="${BRANCH:-main}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Deteksi PHP 8.3+ (Hostinger: versi dipilih lewat hPanel > PHP Configuration,
#    biasanya sudah jadi `php` default di PATH SSH; fallback ke path umum). ──
PHP=""
for candidate in php8.3 php8.2 /usr/bin/php8.3 /usr/bin/php8.2 php; do
    if "$candidate" -r 'exit(PHP_MAJOR_VERSION >= 8 ? 0 : 1);' &>/dev/null 2>&1; then
        PHP="$candidate"
        break
    fi
done

if [ -z "$PHP" ]; then
    echo "❌  Tidak menemukan PHP 8+. Set manual: PHP=/path/to/php8.3 bash deploy.sh"
    exit 1
fi

echo "✅  PHP: $PHP ($($PHP -r 'echo phpversion();')) · Branch: $BRANCH"
echo ""

if [ ! -f .env ]; then
    echo "❌  File .env tidak ditemukan di $SCRIPT_DIR"
    echo "    Salin dari .env.example, isi kredensial produksi, lalu jalankan lagi."
    exit 1
fi

# ── 1. Pull kode terbaru ─────────────────────────────────────────────────────
echo "📦  [1/6] Git pull origin $BRANCH..."
BEFORE_COMMIT="$(git rev-parse HEAD)"
git pull origin "$BRANCH"
echo ""

# ── 2. Composer (skip kalau composer.lock tidak berubah) ────────────────────
if git diff "$BEFORE_COMMIT" --name-only | grep -q "^composer.lock$"; then
    echo "📦  [2/6] composer install --no-dev --optimize-autoloader..."
    COMPOSER="$(command -v composer || true)"
    [ -z "$COMPOSER" ] && { echo "❌  composer tidak ditemukan di PATH."; exit 1; }
    "$PHP" "$COMPOSER" install --no-dev --optimize-autoloader --no-interaction
else
    echo "⏭️   [2/6] composer.lock tidak berubah, skip install."
fi
echo ""

# ── 3. Migrate ────────────────────────────────────────────────────────────────
echo "🗄️   [3/6] php artisan migrate --force..."
$PHP artisan migrate --force
echo ""

# ── 4. Clear semua cache ─────────────────────────────────────────────────────
echo "🧹  [4/6] Clear cache..."
$PHP artisan cache:clear
$PHP artisan config:clear
$PHP artisan route:clear
$PHP artisan view:clear
echo ""

# ── 5. Re-cache config, route, view (optimasi produksi) ─────────────────────
echo "⚡  [5/6] Cache config, route, view..."
$PHP artisan config:cache
$PHP artisan route:cache
$PHP artisan view:cache
echo ""

# ── 6. Storage link (idempotent) ─────────────────────────────────────────────
echo "🔗  [6/6] Storage link..."
$PHP artisan storage:link --quiet 2>/dev/null || true
echo ""

echo "✅  Deploy backend selesai! Cek https://api.yapinet.id/up untuk health check."
