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

printf "  Stopping containers, removing volumes and images..."
if docker compose down -v --rmi all 2>&1; then
    printf " done\n"
else
    printf "\n"
    printf "  ${RED}Failed. Try running with sudo:${NC}\n"
    printf "    sudo bash dangerously_remove.sh\n"
    exit 1
fi

printf "  Removing configuration files..."
rm -f .env Caddyfile
printf " done\n"

echo ""
printf "${RED}${BOLD}  Kitbase has been completely removed.${NC}\n"
echo ""
