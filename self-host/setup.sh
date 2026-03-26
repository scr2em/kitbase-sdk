#!/bin/bash
set -e

# Flags
DRY_RUN=false
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=true ;;
    esac
done

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

select_option() {
    local prompt_text="$1"
    shift
    local options=("$@")
    local selected=0
    local count=${#options[@]}

    printf "  ${BOLD}%s${NC}\n" "$prompt_text"
    printf "  ${DIM}Use arrow keys to select, Enter to confirm${NC}\n"

    # Hide cursor
    tput civis 2>/dev/null

    while true; do
        # Print options
        for i in "${!options[@]}"; do
            if [ "$i" -eq "$selected" ]; then
                printf "  ${CYAN}› %s${NC}\n" "${options[$i]}"
            else
                printf "    %s\n" "${options[$i]}"
            fi
        done

        # Read a single keypress
        IFS= read -rsn1 key
        if [[ "$key" == $'\x1b' ]]; then
            read -rsn2 key
            case "$key" in
                '[A') selected=$(( (selected - 1 + count) % count )) ;;  # Up
                '[B') selected=$(( (selected + 1) % count )) ;;          # Down
            esac
        elif [[ "$key" == "" ]]; then
            break  # Enter
        fi

        # Move cursor up to reprint
        tput cuu "$count" 2>/dev/null
    done

    # Show cursor
    tput cnorm 2>/dev/null

    SELECTED_INDEX=$selected
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
    printf "  ${DIM}Examples: kitbase.example.com, https://kitbase.example.com, 192.168.1.100${NC}\n"
    printf "  ${DIM}Use http://localhost for local testing.${NC}\n"
    prompt DOMAIN "Domain" "http://localhost"

    # Normalize: lowercase, strip whitespace
    DOMAIN=$(echo "$DOMAIN" | tr '[:upper:]' '[:lower:]' | xargs)

    # Extract protocol if provided
    if [[ "$DOMAIN" == https://* ]]; then
        APP_PROTOCOL="https"
        APP_DOMAIN="${DOMAIN#https://}"
    elif [[ "$DOMAIN" == http://* ]]; then
        APP_PROTOCOL="http"
        APP_DOMAIN="${DOMAIN#http://}"
    else
        # No protocol provided — just a bare hostname/IP
        APP_DOMAIN="$DOMAIN"
        # Default: HTTPS for real domains, HTTP for IPs and localhost
        if [[ "$APP_DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ "$APP_DOMAIN" == localhost* ]]; then
            APP_PROTOCOL="http"
        else
            APP_PROTOCOL="https"
        fi
    fi

    # Strip trailing slashes, paths, and port (keep just the hostname/IP)
    APP_DOMAIN="${APP_DOMAIN%%/*}"
    APP_DOMAIN="${APP_DOMAIN%%:*}"

    # Rebuild canonical DOMAIN
    DOMAIN="${APP_PROTOCOL}://${APP_DOMAIN}"

    printf "  ${DIM}→ Using: ${DOMAIN}${NC}\n"

    # SSL / Load Balancer
    SSL_TERMINATED_UPSTREAM=false
    if [ "$APP_PROTOCOL" = "https" ]; then
        printf "\n  ${DIM}If a load balancer (e.g. AWS ALB, CloudFlare) already handles SSL,${NC}\n"
        printf "  ${DIM}Caddy should not manage certificates to avoid redirect loops.${NC}\n"
        prompt_yn SSL_TERMINATED_UPSTREAM "Is SSL handled by a load balancer?" "n"
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
    print_step "Email"
    printf "  ${DIM}Required for invitations and password resets.${NC}\n"
    printf "  ${DIM}You can configure this later in .env if you prefer.${NC}\n"
    echo ""

    MAIL_PROVIDER="smtp"
    SMTP_HOST=""
    SMTP_PORT="587"
    SMTP_USERNAME=""
    SMTP_PASSWORD=""
    SES_ACCESS_KEY=""
    SES_SECRET_KEY=""
    SES_REGION="us-east-1"
    RESEND_API_KEY=""
    MAIL_FROM="noreply@${APP_DOMAIN}"

    select_option "Email provider:" \
        "Skip for now" \
        "SMTP" \
        "AWS SES" \
        "Resend"

    case "$SELECTED_INDEX" in
        0)
            print_warn "Skipping email setup (emails will not be sent)"
            ;;
        1)
            # SMTP
            MAIL_PROVIDER="smtp"
            echo ""
            prompt SMTP_HOST "SMTP host" ""
            prompt SMTP_PORT "SMTP port" "587"
            prompt SMTP_USERNAME "SMTP username" ""
            prompt_secret SMTP_PASSWORD "SMTP password" ""
            prompt MAIL_FROM "From email" "noreply@${APP_DOMAIN}"
            ;;
        2)
            # AWS SES
            MAIL_PROVIDER="ses"
            echo ""
            printf "  ${DIM}The sender email must be verified in your AWS SES account.${NC}\n"
            prompt SES_ACCESS_KEY "AWS access key" ""
            prompt_secret SES_SECRET_KEY "AWS secret key" ""
            prompt SES_REGION "AWS region" "us-east-1"
            prompt MAIL_FROM "From email (must be SES-verified)" "noreply@${APP_DOMAIN}"
            ;;
        3)
            # Resend
            MAIL_PROVIDER="resend"
            echo ""
            printf "  ${DIM}Get your API key from https://resend.com/api-keys${NC}\n"
            prompt_secret RESEND_API_KEY "Resend API key" ""
            prompt MAIL_FROM "From email (must use a verified Resend domain)" "noreply@${APP_DOMAIN}"
            ;;
    esac

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

    # Storage
    print_step "File Storage"
    printf "  ${DIM}Used for OTA update files. If you're not using OTA updates, feel free to skip.${NC}\n"
    printf "  ${DIM}Local disk works out of the box — cloud storage is optional and can be configured later in .env.${NC}\n"
    echo ""

    S3_BUCKET_NAME=""
    S3_REGION=""
    S3_ACCESS_KEY=""
    S3_SECRET_KEY=""
    S3_ENDPOINT=""
    S3_PUBLIC_URL=""

    select_option "Storage provider:" \
        "Local disk (default, no setup needed)" \
        "AWS S3" \
        "Cloudflare R2" \
        "DigitalOcean Spaces" \
        "MinIO (self-hosted)" \
        "Google Cloud Storage (S3-compatible)" \
        "Other S3-compatible provider"

    case "$SELECTED_INDEX" in
        0)
            print_success "Using local storage"
            ;;
        1)
            # AWS S3
            echo ""
            prompt S3_BUCKET_NAME "Bucket name" ""
            prompt S3_REGION "Region" "us-east-1"
            prompt S3_ACCESS_KEY "Access key" ""
            prompt_secret S3_SECRET_KEY "Secret key" ""
            ;;
        2)
            # Cloudflare R2
            echo ""
            printf "  ${DIM}Find your Account ID in the Cloudflare dashboard under R2.${NC}\n"
            prompt S3_BUCKET_NAME "Bucket name" ""
            local account_id=""
            prompt account_id "Cloudflare Account ID" ""
            S3_ENDPOINT="https://${account_id}.r2.cloudflarestorage.com"
            S3_REGION="auto"
            prompt S3_ACCESS_KEY "R2 Access key" ""
            prompt_secret S3_SECRET_KEY "R2 Secret key" ""
            prompt S3_PUBLIC_URL "Public URL (optional, e.g. https://files.example.com)" ""
            ;;
        3)
            # DigitalOcean Spaces
            echo ""
            prompt S3_BUCKET_NAME "Space name" ""
            prompt S3_REGION "Region" "nyc3"
            S3_ENDPOINT="https://${S3_REGION}.digitaloceanspaces.com"
            S3_PUBLIC_URL="https://${S3_BUCKET_NAME}.${S3_REGION}.digitaloceanspaces.com"
            prompt S3_ACCESS_KEY "Spaces access key" ""
            prompt_secret S3_SECRET_KEY "Spaces secret key" ""
            ;;
        4)
            # MinIO
            echo ""
            prompt S3_ENDPOINT "MinIO endpoint" "http://minio:9000"
            prompt S3_BUCKET_NAME "Bucket name" "kitbase"
            S3_REGION="us-east-1"
            prompt S3_ACCESS_KEY "Access key" "minioadmin"
            prompt_secret S3_SECRET_KEY "Secret key" "minioadmin"
            prompt S3_PUBLIC_URL "Public URL" "${S3_ENDPOINT}/${S3_BUCKET_NAME}"
            ;;
        5)
            # Google Cloud Storage
            echo ""
            printf "  ${DIM}Using GCS S3-compatible XML API with HMAC keys.${NC}\n"
            printf "  ${DIM}Create HMAC keys in Cloud Console → Storage → Settings → Interoperability.${NC}\n"
            prompt S3_BUCKET_NAME "GCS bucket name" ""
            S3_ENDPOINT="https://storage.googleapis.com"
            S3_REGION="auto"
            prompt S3_ACCESS_KEY "HMAC Access key" ""
            prompt_secret S3_SECRET_KEY "HMAC Secret key" ""
            S3_PUBLIC_URL="https://storage.googleapis.com/${S3_BUCKET_NAME}"
            ;;
        6)
            # Other S3-compatible
            echo ""
            prompt S3_ENDPOINT "S3 API endpoint" ""
            prompt S3_BUCKET_NAME "Bucket name" ""
            prompt S3_REGION "Region" "us-east-1"
            prompt S3_ACCESS_KEY "Access key" ""
            prompt_secret S3_SECRET_KEY "Secret key" ""
            prompt S3_PUBLIC_URL "Public URL (optional)" ""
            ;;
    esac
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
    elif [ "$SSL_TERMINATED_UPSTREAM" = true ]; then
        # SSL handled by load balancer — Caddy listens on HTTP only
        site_address="http://${APP_DOMAIN}"
    elif [ "$APP_PROTOCOL" = "https" ]; then
        # Real domain with HTTPS: Caddy auto-provisions SSL
        site_address="$APP_DOMAIN"
    else
        # HTTP only (e.g., localhost or explicit http://)
        site_address="http://${APP_DOMAIN}"
    fi

    local caddyfile_content="${site_address} {
    encode gzip

    handle /api/* {
        reverse_proxy backend:8100
    }

    handle {
        reverse_proxy dashboard:80
    }
}"

    if [ "$DRY_RUN" = true ]; then
        echo ""
        printf "${DIM}--- Caddyfile ---%s${NC}\n"
        echo "$caddyfile_content"
        printf "${DIM}--- end Caddyfile ---${NC}\n"
    else
        echo "$caddyfile_content" > Caddyfile
    fi

    print_success "Caddyfile created"
}

write_env() {
    print_step "Writing .env file"

    local env_content
    env_content=$(cat << EOF
# Generated by Kitbase setup script

# Security
JWT_SECRET="${JWT_SECRET}"

# Authentication
# Access token lifetime in milliseconds (default: 1 hour)
JWT_EXPIRATION=3600000
# Refresh token lifetime in milliseconds (default: 7 days)
JWT_REFRESH_EXPIRATION=604800000

# Database
DATABASE_PASSWORD=${DB_PASSWORD}

# App
APP_DOMAIN=${APP_DOMAIN}
APP_PROTOCOL=${APP_PROTOCOL}
MAIL_BASE_URL=${DOMAIN}

# Email
MAIL_PROVIDER=${MAIL_PROVIDER}
MAIL_FROM=${MAIL_FROM}

# SMTP (when MAIL_PROVIDER=smtp)
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USERNAME=${SMTP_USERNAME}
SMTP_PASSWORD=${SMTP_PASSWORD}

# AWS SES (when MAIL_PROVIDER=ses)
SES_ACCESS_KEY=${SES_ACCESS_KEY}
SES_SECRET_KEY=${SES_SECRET_KEY}
SES_REGION=${SES_REGION}

# Resend (when MAIL_PROVIDER=resend)
RESEND_API_KEY=${RESEND_API_KEY}

# OAuth
OAUTH_GOOGLE_CLIENT_ID=${OAUTH_GOOGLE_CLIENT_ID}
OAUTH_GOOGLE_CLIENT_SECRET=${OAUTH_GOOGLE_CLIENT_SECRET}
OAUTH_GITHUB_CLIENT_ID=${OAUTH_GITHUB_CLIENT_ID}
OAUTH_GITHUB_CLIENT_SECRET=${OAUTH_GITHUB_CLIENT_SECRET}

# Storage (S3-compatible)
S3_BUCKET_NAME=${S3_BUCKET_NAME}
S3_REGION=${S3_REGION}
S3_ACCESS_KEY=${S3_ACCESS_KEY}
S3_SECRET_KEY=${S3_SECRET_KEY}
S3_ENDPOINT=${S3_ENDPOINT}
S3_PUBLIC_URL=${S3_PUBLIC_URL}
EOF
)

    if [ "$DRY_RUN" = true ]; then
        echo ""
        printf "${DIM}--- .env ---%s${NC}\n"
        echo "$env_content"
        printf "${DIM}--- end .env ---${NC}\n"
    else
        echo "$env_content" > .env
    fi

    print_success ".env file created"
}

# =============================================================================
# Main
# =============================================================================

print_banner

echo "  Welcome to the Kitbase self-hosted setup!"
echo ""
if [ "$DRY_RUN" = true ]; then
    printf "  ${YELLOW}${BOLD}DRY RUN${NC} — no files will be written, no services started.\n"
    printf "  ${DIM}Generated config will be printed to stdout.${NC}\n"
else
    printf "  ${DIM}This script will check dependencies, walk you through${NC}\n"
    printf "  ${DIM}the configuration, and start Kitbase on your server.${NC}\n"
fi

if [ "$DRY_RUN" = false ]; then
    check_dependencies
fi

configure
write_caddyfile
write_env

if [ "$DRY_RUN" = true ]; then
    echo ""
    echo "======================================================================"
    printf "${GREEN}${BOLD}  Dry run complete!${NC}\n"
    echo ""
    printf "  Run without ${BOLD}--dry-run${NC} to write files and start services.\n"
    echo "======================================================================"
    echo ""
else
    # Start
    print_step "Starting Kitbase"

    if docker compose version &> /dev/null; then
        docker compose up -d --force-recreate
    else
        docker-compose up -d --force-recreate
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
fi
