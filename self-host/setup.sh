#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

print_banner() {
    echo ""
    printf "${CYAN}"
    echo "  _  ___ _   _                    "
    echo " | |/ (_) | | |                   "
    echo " | ' / _| |_| |__   __ _ ___  ___ "
    echo " |  < | | __| '_ \ / _\` / __|/ _ \\"
    echo " | . \\| | |_| |_) | (_| \\__ \\  __/"
    echo " |_|\\_\\_|\\__|_.__/ \\__,_|___/\\___|"
    printf "${NC}"
    echo ""
    printf "${DIM}  Self-Hosted Setup${NC}\n"
    echo ""
}

print_step() {
    printf "\n${BOLD}${CYAN}▸ %s${NC}\n" "$1"
}

print_success() {
    printf "${GREEN}  ✓${NC} %s\n" "$1"
}

print_warn() {
    printf "${YELLOW}  !${NC} %s\n" "$1"
}

print_error() {
    printf "${RED}  ✗${NC} %s\n" "$1"
}

prompt() {
    local var_name="$1"
    local message="$2"
    local default="$3"
    local value=""

    if [ -n "$default" ]; then
        printf "  ${BOLD}%s${NC} ${DIM}(%s)${NC}: " "$message" "$default"
    else
        printf "  ${BOLD}%s${NC}: " "$message"
    fi
    read -r value
    value="${value:-$default}"
    eval "$var_name=\"\$value\""
}

prompt_secret() {
    local var_name="$1"
    local message="$2"
    local default="$3"
    local value=""

    if [ -n "$default" ]; then
        printf "  ${BOLD}%s${NC} ${DIM}(%s)${NC}: " "$message" "$default"
    else
        printf "  ${BOLD}%s${NC}: " "$message"
    fi
    read -rs value
    echo ""
    value="${value:-$default}"
    eval "$var_name=\"\$value\""
}

prompt_yn() {
    local var_name="$1"
    local message="$2"
    local default="$3"
    local value=""

    if [ "$default" = "y" ]; then
        printf "  ${BOLD}%s${NC} ${DIM}(Y/n)${NC}: " "$message"
    else
        printf "  ${BOLD}%s${NC} ${DIM}(y/N)${NC}: " "$message"
    fi
    read -r value
    value="${value:-$default}"
    case "$value" in
        [Yy]*) eval "$var_name=true" ;;
        *) eval "$var_name=false" ;;
    esac
}

generate_secret() {
    openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64
}

# =============================================================================
# Dependency checks
# =============================================================================

check_dependencies() {
    print_step "Checking dependencies"

    local missing=false

    # Docker
    if command -v docker &> /dev/null; then
        print_success "Docker $(docker --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1)"
    else
        print_error "Docker is not installed"
        prompt_yn INSTALL_DOCKER "Install Docker now?" "y"
        if [ "$INSTALL_DOCKER" = true ]; then
            install_docker
        else
            printf "\n${RED}Docker is required. Install it from https://docs.docker.com/get-docker/${NC}\n"
            exit 1
        fi
    fi

    # Docker Compose
    if docker compose version &> /dev/null; then
        print_success "Docker Compose $(docker compose version --short 2>&1)"
    elif command -v docker-compose &> /dev/null; then
        print_success "docker-compose $(docker-compose --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1)"
    else
        print_error "Docker Compose is not installed"
        prompt_yn INSTALL_COMPOSE "Install Docker Compose now?" "y"
        if [ "$INSTALL_COMPOSE" = true ]; then
            install_docker_compose
        else
            printf "\n${RED}Docker Compose is required.${NC}\n"
            exit 1
        fi
    fi

    # Docker daemon
    if docker info &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        printf "  Run: ${YELLOW}sudo systemctl start docker${NC}\n"
        exit 1
    fi

    # RAM check
    local total_mb=0
    if [ -f /proc/meminfo ]; then
        total_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
    elif command -v sysctl &> /dev/null; then
        total_mb=$(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1024 / 1024 ))
    fi

    if [ "$total_mb" -gt 0 ]; then
        if [ "$total_mb" -ge 2048 ]; then
            print_success "RAM: ${total_mb} MB"
        else
            print_warn "RAM: ${total_mb} MB (recommended: 2048 MB+)"
        fi
    fi
}

install_docker() {
    echo ""
    print_warn "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker "$USER"
    print_success "Docker installed"
}

install_docker_compose() {
    echo ""
    print_warn "Installing Docker Compose..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker-compose-plugin
    print_success "Docker Compose installed"
}

# =============================================================================
# Interactive configuration
# =============================================================================

configure() {
    # Domain
    print_step "Domain"
    printf "  ${DIM}The URL where Kitbase will be accessible.${NC}\n"
    printf "  ${DIM}Use http://localhost for local testing.${NC}\n"
    prompt DOMAIN "Domain" "http://localhost"

    # Strip trailing slash
    DOMAIN="${DOMAIN%/}"

    # Extract protocol and host
    if [[ "$DOMAIN" == https://* ]]; then
        APP_PROTOCOL="https"
        APP_DOMAIN="${DOMAIN#https://}"
    else
        APP_PROTOCOL="http"
        APP_DOMAIN="${DOMAIN#http://}"
    fi

    # Security
    print_step "Security"
    local generated_secret
    generated_secret=$(generate_secret)
    printf "  ${DIM}JWT secret for signing auth tokens.${NC}\n"
    prompt JWT_SECRET "JWT secret" "$generated_secret"

    # Database
    print_step "Database"
    printf "  ${DIM}MySQL root password.${NC}\n"
    prompt_secret DB_PASSWORD "Database password" "kitbase"

    # Email
    print_step "Email (SMTP)"
    printf "  ${DIM}Required for invitations and password resets.${NC}\n"
    prompt_yn CONFIGURE_SMTP "Configure SMTP now?" "n"

    SMTP_HOST=""
    SMTP_PORT="587"
    SMTP_USERNAME=""
    SMTP_PASSWORD=""
    MAIL_FROM="noreply@${APP_DOMAIN}"

    if [ "$CONFIGURE_SMTP" = true ]; then
        prompt SMTP_HOST "SMTP host" ""
        prompt SMTP_PORT "SMTP port" "587"
        prompt SMTP_USERNAME "SMTP username" ""
        prompt_secret SMTP_PASSWORD "SMTP password" ""
        prompt MAIL_FROM "From email" "noreply@${APP_DOMAIN}"
    fi

    # OAuth
    print_step "OAuth (optional)"
    prompt_yn CONFIGURE_OAUTH "Configure OAuth providers?" "n"

    OAUTH_GOOGLE_CLIENT_ID=""
    OAUTH_GOOGLE_CLIENT_SECRET=""
    OAUTH_GITHUB_CLIENT_ID=""
    OAUTH_GITHUB_CLIENT_SECRET=""

    if [ "$CONFIGURE_OAUTH" = true ]; then
        echo ""
        printf "  ${DIM}Google OAuth:${NC}\n"
        prompt OAUTH_GOOGLE_CLIENT_ID "  Google Client ID" ""
        prompt OAUTH_GOOGLE_CLIENT_SECRET "  Google Client Secret" ""
        echo ""
        printf "  ${DIM}GitHub OAuth:${NC}\n"
        prompt OAUTH_GITHUB_CLIENT_ID "  GitHub Client ID" ""
        prompt OAUTH_GITHUB_CLIENT_SECRET "  GitHub Client Secret" ""
    fi
}

# =============================================================================
# Write .env file
# =============================================================================

write_caddyfile() {
    print_step "Generating Caddyfile"

    local site_address

    # IPs can't get SSL certificates
    if [[ "$APP_DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        site_address="http://${APP_DOMAIN}"
    elif [ "$APP_PROTOCOL" = "https" ]; then
        # Real domain with HTTPS: Caddy auto-provisions SSL
        site_address="$APP_DOMAIN"
    else
        # HTTP only (e.g., localhost or explicit http://)
        site_address="http://${APP_DOMAIN}"
    fi

    cat > Caddyfile << CADDYEOF
${site_address} {
    encode gzip

    handle /api/* {
        reverse_proxy backend:8100
    }

    handle {
        reverse_proxy dashboard:80
    }
}
CADDYEOF

    print_success "Caddyfile created"
}

write_env() {
    print_step "Writing .env file"

    cat > .env << EOF
# Generated by Kitbase setup script

# Security
JWT_SECRET=${JWT_SECRET}

# Database
DATABASE_PASSWORD=${DB_PASSWORD}

# App
APP_DOMAIN=${APP_DOMAIN}
APP_PROTOCOL=${APP_PROTOCOL}
MAIL_BASE_URL=${DOMAIN}

# SMTP
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USERNAME=${SMTP_USERNAME}
SMTP_PASSWORD=${SMTP_PASSWORD}
MAIL_FROM=${MAIL_FROM}

# OAuth
OAUTH_GOOGLE_CLIENT_ID=${OAUTH_GOOGLE_CLIENT_ID}
OAUTH_GOOGLE_CLIENT_SECRET=${OAUTH_GOOGLE_CLIENT_SECRET}
OAUTH_GITHUB_CLIENT_ID=${OAUTH_GITHUB_CLIENT_ID}
OAUTH_GITHUB_CLIENT_SECRET=${OAUTH_GITHUB_CLIENT_SECRET}
EOF

    # Remove empty lines (unset optional values)
    sed -i.bak '/=$/d' .env 2>/dev/null && rm -f .env.bak || true

    print_success ".env file created"
}

# =============================================================================
# Main
# =============================================================================

print_banner

echo "  Welcome to the Kitbase self-hosted setup!"
echo ""
printf "  ${DIM}This script will check dependencies, walk you through${NC}\n"
printf "  ${DIM}the configuration, and start Kitbase on your server.${NC}\n"

check_dependencies
configure
write_caddyfile
write_env

# Start
print_step "Starting Kitbase"

if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo ""
echo "======================================================================"
printf "${GREEN}${BOLD}  Kitbase is running!${NC}\n"
echo ""
printf "  ${BOLD}Dashboard:${NC}  ${DOMAIN}\n"
printf "  ${BOLD}API:${NC}        ${DOMAIN}/api\n"
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f        # View logs"
echo "    docker compose ps             # Check status"
echo "    docker compose pull && docker compose up -d   # Update"
echo "    docker compose down           # Stop"
echo "    docker compose down -v        # Stop and delete data"
echo ""
printf "  ${BOLD}Join our Discord:${NC} https://discord.com/invite/HWBvgH8eVN\n"
echo ""
echo "======================================================================"
echo ""
