#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-frontend.sh — Build & upload frontend Yapinet ke Hostinger
#
# Jalankan DI KOMPUTER LOKAL (bukan di server) dari root repo:
#     bash deploy-frontend.sh
#
# Kenapa build lokal, bukan di server: Hostinger Business Shared Hosting
# tidak menjamin runtime Node.js untuk `npm run build` (fitur "Node.js App"
# di hPanel itu untuk menjalankan server Node permanen, bukan cocok buat
# sekadar build sekali jalan) — jadi build dilakukan lokal, hasil statisnya
# (frontend/dist/) di-upload lewat rsync over SSH.
#
# Prasyarat satu kali:
#   1. Domain utama yapinet.id document root-nya folder public_html biasa
#      (bukan diarahkan ke folder backend) — ini yang akan diisi file statis.
#   2. SSH key sudah terpasang di Hostinger (hPanel > Advanced > SSH Access)
#      supaya rsync tidak minta password tiap kali.
#   3. Isi HOSTINGER_SSH & HOSTINGER_PATH di bawah (atau lewat env var) sesuai
#      akun Hostinger kamu — lihat detailnya di hPanel > Hosting > SSH Access.
#
# Override lewat env var, contoh:
#   HOSTINGER_SSH=u123456789@1.2.3.4 HOSTINGER_PATH=domains/yapinet.id/public_html bash deploy-frontend.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Ganti default di bawah sesuai akun Hostinger kamu ────────────────────────
HOSTINGER_SSH="${HOSTINGER_SSH:-u000000000@yapinet.id}"
HOSTINGER_PORT="${HOSTINGER_PORT:-65002}"                       # port SSH Hostinger biasanya bukan 22, cek di hPanel
HOSTINGER_PATH="${HOSTINGER_PATH:-domains/yapinet.id/public_html}"
API_URL="${API_URL:-https://api.yapinet.id}"
SSH_KEY="${SSH_KEY:-}"                                          # opsional: path private key kalau bukan default ~/.ssh/id_*

SSH_CMD="ssh -p $HOSTINGER_PORT"
[ -n "$SSH_KEY" ] && SSH_CMD="ssh -p $HOSTINGER_PORT -i $SSH_KEY"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/frontend"

echo "✅  Target: $HOSTINGER_SSH:$HOSTINGER_PATH (port $HOSTINGER_PORT)"
echo "✅  API_URL yang di-bake ke build: $API_URL"
echo ""

# ── 1. Install dependency ────────────────────────────────────────────────────
echo "📦  [1/3] npm ci..."
npm ci
echo ""

# ── 2. Build produksi ────────────────────────────────────────────────────────
echo "🏗️   [2/3] npm run build (VITE_API_URL=$API_URL)..."
VITE_API_URL="$API_URL" npm run build
echo ""

if [ ! -d dist ]; then
    echo "❌  Folder dist/ tidak ditemukan setelah build."
    exit 1
fi

# ── 3. Upload lewat rsync ─────────────────────────────────────────────────────
# SENGAJA TANPA --delete: HOSTINGER_PATH (public_html domain utama) sering
# berbagi folder dengan clone backend Laravel (mis. public_html/yapinet/) di
# layout Hostinger ini — --delete pernah menghapus seluruh folder itu (bukan
# bagian dari dist/) karena rsync menganggapnya "file basi". Kalau memang mau
# bersih-bersih file lama punya build FE sebelumnya, hapus manual/spesifik di
# server, jangan pakai --delete di sini.
echo "🚀  [3/3] rsync dist/ -> server (tanpa --delete, lihat komentar di atas)..."
rsync -avz -e "$SSH_CMD" dist/ "$HOSTINGER_SSH:$HOSTINGER_PATH/"
echo ""

echo "✅  Deploy frontend selesai! Cek https://yapinet.id"
