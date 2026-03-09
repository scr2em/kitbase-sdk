#!/bin/bash
set -e

RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

echo ""
printf "${RED}${BOLD}  ⚠  Kitbase — Complete Removal${NC}\n"
echo ""
printf "  This will ${RED}permanently${NC} delete:\n"
echo "    • All Kitbase containers"
echo "    • All Kitbase images"
echo "    • All data (MySQL, ClickHouse, Redis volumes)"
echo "    • Your .env and Caddyfile configuration"
echo ""
printf "${BOLD}  Are you sure?${NC} ${DIM}(type 'yes' to confirm)${NC}: "
read -r confirm

if [ "$confirm" != "yes" ]; then
    echo "  Aborted."
    exit 0
fi

echo ""

printf "  Stopping containers and removing volumes..."
docker compose down -v 2>/dev/null || true
printf " done\n"

printf "  Removing images..."
docker rmi scr2em/kitbase-server:selfhosted scr2em/kitbase-dashboard:latest caddy:2-alpine mysql:8.3 clickhouse/clickhouse-server:24.3 redis:7.2-alpine 2>/dev/null || true
printf " done\n"

printf "  Removing configuration files..."
rm -f .env Caddyfile
printf " done\n"

echo ""
printf "${RED}${BOLD}  Kitbase has been completely removed.${NC}\n"
echo ""
