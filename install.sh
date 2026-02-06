#!/bin/bash
#
# Telebot - Installation automatique
# Usage: curl -fsSL https://raw.githubusercontent.com/anthonymarandon/telebot/main/install.sh | bash
#

set -e

REPO="https://raw.githubusercontent.com/anthonymarandon/telebot/main"
TELEBOT_DIR="$HOME/.telebot"
INSTALL_STARTED=false

# Bash 3.2 (macOS) doesn't accept fractional seconds for `read -t`.
if (( BASH_VERSINFO[0] >= 4 )); then
    READ_TIMEOUT="0.1"
else
    READ_TIMEOUT="1"
fi

detect_os() {
    case "$(uname -s)" in
        Darwin*) echo "macos" ;;
        Linux*)  echo "linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *)       echo "unknown" ;;
    esac
}
OS_TYPE=$(detect_os)

get_temp_dir() {
    if [ -n "$TMPDIR" ]; then
        echo "$TMPDIR"
    elif [ -n "$TEMP" ]; then
        echo "$TEMP"
    elif [ -n "$TMP" ]; then
        echo "$TMP"
    else
        echo "/tmp"
    fi
}
TEMP_DIR=$(get_temp_dir)

# Compatible Bash 3.2+
repeat_char() {
    local char="$1" count="$2" result=""
    local i=0
    while [ $i -lt $count ]; do
        result="${result}${char}"
        i=$((i + 1))
    done
    printf "%s" "$result"
}

copy_to_clipboard() {
    local text="$1"
    case "$OS_TYPE" in
        macos)
            echo "$text" | pbcopy && return 0
            ;;
        linux)
            if command -v xclip >/dev/null 2>&1; then
                echo "$text" | xclip -selection clipboard && return 0
            elif command -v xsel >/dev/null 2>&1; then
                echo "$text" | xsel --clipboard && return 0
            fi
            ;;
        windows)
            echo "$text" | clip.exe && return 0
            ;;
    esac
    return 1
}

read_key() {
    if [ "$OS_TYPE" = "windows" ]; then
        read "$@"
    else
        read "$@" < /dev/tty
    fi
}

get_file_mtime() {
    local file="$1"
    case "$OS_TYPE" in
        macos)   stat -f %m "$file" 2>/dev/null ;;
        linux)   stat -c %Y "$file" 2>/dev/null ;;
        windows) stat -c %Y "$file" 2>/dev/null ;;  # Git Bash supporte -c
    esac
}

get_bin_dir() {
    case "$OS_TYPE" in
        macos|linux) echo "$HOME/.local/bin" ;;
        windows)     echo "$HOME/bin" ;;
    esac
}
BIN_DIR=$(get_bin_dir)

get_shell_rc() {
    case "$OS_TYPE" in
        windows) echo "$HOME/.bashrc" ;;
        *)
            if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
                echo "$HOME/.zshrc"
            else
                echo "$HOME/.bashrc"
            fi
            ;;
    esac
}

supports_color() {
    [ -t 1 ] && command -v tput >/dev/null 2>&1 && [ "$(tput colors)" -ge 8 ]
}

if supports_color; then
    C_RESET="$(tput sgr0)"
    C_BOLD="$(tput bold)"
    C_DIM="$(tput dim)"
    C_RED="$(tput setaf 1)"
    C_GREEN="$(tput setaf 2)"
    C_YELLOW="$(tput setaf 3)"
    C_BLUE="$(tput setaf 4)"
    C_CYAN="$(tput setaf 6)"
else
    C_RESET=""
    C_BOLD=""
    C_DIM=""
    C_RED=""
    C_GREEN=""
    C_YELLOW=""
    C_BLUE=""
    C_CYAN=""
fi

hr() {
    printf "%s\n" "─────────────────────────────────────────"
}

logo() {
    local ver="${1:-}"
    echo ""
    echo "   ${C_CYAN}══════════════════════════════════════════════════════════════${C_RESET}"
    echo "      ${C_CYAN}████████╗███████╗██╗     ███████╗██████╗  ██████╗ ████████╗${C_RESET}"
    echo "      ${C_CYAN}╚══██╔══╝██╔════╝██║     ██╔════╝██╔══██╗██╔═══██╗╚══██╔══╝${C_RESET}"
    echo "         ${C_CYAN}██║   █████╗  ██║     █████╗  ██████╔╝██║   ██║   ██║${C_RESET}"
    echo "         ${C_CYAN}██║   ██╔══╝  ██║     ██╔══╝  ██╔══██╗██║   ██║   ██║${C_RESET}"
    echo "         ${C_CYAN}██║   ███████╗███████╗███████╗██████╔╝╚██████╔╝   ██║${C_RESET}"
    echo "         ${C_CYAN}╚═╝   ╚══════╝╚══════╝╚══════╝╚═════╝  ╚═════╝    ╚═╝${C_RESET}"
    echo "   ${C_CYAN}══════════════════════════════════════════════════════════════${C_RESET}"
    echo "                    ${C_DIM}🤖 Claude Code × Telegram${C_RESET}"
    if [ -n "$ver" ]; then
        echo "                           ${C_DIM}v${ver}${C_RESET}"
    fi
}

banner() {
    clear
    logo "$VERSION"
    hr
}

spinner() {
    local pid=$1
    local msg=$2
    local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
    local i=0

    tput civis 2>/dev/null || true
    while kill -0 "$pid" 2>/dev/null; do
        printf "\r  %s%s%s %s" "${C_BLUE}" "${frames[$i]}" "${C_RESET}" "$msg"
        i=$(( (i + 1) % 10 ))
        sleep 0.1
    done
    wait "$pid"
    local exit_code=$?
    tput cnorm 2>/dev/null || true

    if [ $exit_code -eq 0 ]; then
        printf "\r  %s✔%s %s\n" "${C_GREEN}" "${C_RESET}" "$msg"
    else
        printf "\r  %s✖%s %s\n" "${C_RED}" "${C_RESET}" "$msg"
        return 1
    fi
}

step_run() {
    local msg=$1
    shift
    "$@" &>/dev/null &
    spinner $! "$msg"
}

PROGRESS_ZONE_LINES=0

progress_bar_inline() {
    local current=$1
    local total=$2
    local label=$3
    local width=30
    local filled=$((current * width / total))
    local empty=$((width - filled))

    printf "  ${C_CYAN}[${C_RESET}"
    local f=0  # Bash 3.2 compat: no {1..N}
    while [ $f -lt $filled ]; do
        printf "█"
        f=$((f + 1))
    done
    local e=0
    while [ $e -lt $empty ]; do
        printf "░"
        e=$((e + 1))
    done
    printf "${C_CYAN}]${C_RESET} %s/%s %s" "$current" "$total" "$label"
}

clear_progress_zone() {
    if [ $PROGRESS_ZONE_LINES -gt 0 ]; then
        local l=0
        while [ $l -lt $PROGRESS_ZONE_LINES ]; do
            tput cuu1 2>/dev/null || printf "\033[1A"
            tput el 2>/dev/null || printf "\033[K"
            l=$((l + 1))
        done
    fi
    PROGRESS_ZONE_LINES=0
}

# Usage: install_step step total label msg command [args...]
install_step() {
    local step=$1
    local total=$2
    local label=$3
    local msg=$4
    shift 4

    clear_progress_zone
    progress_bar_inline "$step" "$total" "$label"
    echo ""
    PROGRESS_ZONE_LINES=1

    "$@" &>/dev/null &
    local pid=$!
    local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
    local i=0

    tput civis 2>/dev/null || true
    while kill -0 "$pid" 2>/dev/null; do
        printf "\r  %s%s%s %s" "${C_BLUE}" "${frames[$i]}" "${C_RESET}" "$msg"
        i=$(( (i + 1) % 10 ))
        sleep 0.1
    done

    wait "$pid"
    local exit_code=$?
    tput cnorm 2>/dev/null || true

    if [ $exit_code -eq 0 ]; then
        printf "\r  %s✔%s %s" "${C_GREEN}" "${C_RESET}" "$msg"
        tput el 2>/dev/null || printf "\033[K"
        echo ""
        PROGRESS_ZONE_LINES=2  # barre + statut
        return 0
    else
        printf "\r  %s✖%s %s" "${C_RED}" "${C_RESET}" "$msg"
        tput el 2>/dev/null || printf "\033[K"
        echo ""
        PROGRESS_ZONE_LINES=2
        return 1
    fi
}

section() {
    echo ""
    printf "  %s%s%s\n" "${C_BOLD}" "$1" "${C_RESET}"
    echo ""
}

step() {
    printf "  %s→%s %s\n" "${C_BLUE}" "${C_RESET}" "$1"
}

success() {
    printf "  %s✔%s %s\n" "${C_GREEN}" "${C_RESET}" "$1"
}

fail() {
    printf "  %s✖%s %s\n" "${C_RED}" "${C_RESET}" "$1"
}

# Usage: menu "Question" "Option1" "Option2" → retourne l'index choisi
menu() {
    local prompt="$1"
    shift
    local options=("$@")
    local selected=0
    local count=${#options[@]}
    local box_width=35

    echo "$prompt"
    echo ""
    tput civis 2>/dev/null || true

    cleanup_menu() {
        tput cnorm 2>/dev/null || true
    }
    trap cleanup_menu EXIT

    while true; do
        for i in "${!options[@]}"; do
            tput el 2>/dev/null || printf "\033[K"
            if [ "$i" -eq "$selected" ]; then
                local label="${options[$i]}"
                local padding=$((box_width - ${#label} - 4))
                [ $padding -lt 0 ] && padding=0
                echo "  ${C_CYAN}┌$(repeat_char '─' $box_width)┐${C_RESET}"
                echo "  ${C_CYAN}│${C_RESET} ${C_CYAN}▶${C_RESET} ${C_BOLD}${label}${C_RESET}$(repeat_char ' ' $padding)${C_CYAN}│${C_RESET}"
                echo "  ${C_CYAN}└$(repeat_char '─' $box_width)┘${C_RESET}"
            else
                echo "     ${C_DIM}${options[$i]}${C_RESET}"
            fi
        done

        IFS= read_key -rsn1 key

        if [[ $key == $'\x1b' ]]; then
            read_key -rsn2 -t "$READ_TIMEOUT" key
            case $key in
                '[A') ((selected--)); [ $selected -lt 0 ] && selected=$((count - 1)) ;;
                '[B') ((selected++)); [ "$selected" -ge "$count" ] && selected=0 ;;
            esac
        elif [[ $key == "" ]]; then
            break
        fi

        # +2 pour les lignes d'encadré de la sélection
        local lines_to_go_up=$((count + 2))
        tput cuu "$lines_to_go_up" 2>/dev/null || printf "\033[%sA" "$lines_to_go_up"
    done

    tput cnorm 2>/dev/null || true
    trap - EXIT

    echo ""
    return $selected
}

cleanup_on_error() {
    if [ "$INSTALL_STARTED" = true ] && [ -d "$TELEBOT_DIR" ]; then
        echo ""
        echo "🧹 Nettoyage suite à l'échec..."
        rm -rf "$TELEBOT_DIR"
        echo "   Dossier $TELEBOT_DIR supprimé"
    fi
    exit 1
}

trap cleanup_on_error ERR

fetch_version() {
    curl -fsSL "$REPO/package.json" 2>/dev/null | grep '"version"' | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/'
}
VERSION=$(fetch_version)
[ -z "$VERSION" ] && VERSION="1.x.x"

banner

section "🤖 Bienvenue dans l'installateur de Telebot"

echo "  Telebot te permet de contrôler Claude Code"
echo "  à distance depuis Telegram."
echo ""
hr
echo ""

EXISTING_CONFIG=""
if [ -d "$TELEBOT_DIR" ]; then
    echo "  ${C_YELLOW}⚠${C_RESET}  Installation existante détectée"
    echo "     ${C_DIM}$TELEBOT_DIR${C_RESET}"
    echo ""

    if [ -f "$TELEBOT_DIR/config.env" ]; then
        EXISTING_CONFIG=$(cat "$TELEBOT_DIR/config.env")
        echo "  ${C_DIM}Ta configuration actuelle sera conservée.${C_RESET}"
        echo ""
    fi

    menu "  Que veux-tu faire?" "Réinstaller Telebot" "Annuler"
    if [ $? -eq 1 ]; then
        echo ""
        echo "  ${C_DIM}Installation annulée.${C_RESET}"
        echo ""
        exit 0
    fi

    rm -rf "$TELEBOT_DIR"
    success "Ancienne installation supprimée"
    echo ""
else
    menu "  Veux-tu procéder à l'installation?" "Oui, installer Telebot" "Non, annuler"
    if [ $? -eq 1 ]; then
        echo ""
        echo "  ${C_DIM}Installation annulée.${C_RESET}"
        echo ""
        exit 0
    fi
    echo ""
fi

section "📋 Prérequis"

check_prereq() {
    local name=$1
    local cmd=$2
    local version=""

    if command -v "$cmd" &> /dev/null; then
        version=$($cmd --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1)
        printf "  ${C_GREEN}✔${C_RESET} %-14s ${C_DIM}%s${C_RESET}\n" "$name" "$version"
        return 0
    else
        printf "  ${C_RED}✖${C_RESET} %-14s ${C_RED}non trouvé${C_RESET}\n" "$name"
        return 1
    fi
}

prereq_ok=true
check_prereq "Node.js" "node" || prereq_ok=false
check_prereq "npm" "npm" || prereq_ok=false
check_prereq "tmux" "tmux" || prereq_ok=false
check_prereq "Claude Code" "claude" || echo "     ${C_DIM}(optionnel)${C_RESET}"

echo ""

if [ "$prereq_ok" = false ]; then
    hr
    echo ""
    echo "  ${C_YELLOW}💡 Installation requise :${C_RESET}"
    echo ""
    case "$OS_TYPE" in
        macos)
            echo "     ${C_DIM}brew install node tmux${C_RESET}"
            ;;
        linux)
            echo "     ${C_DIM}sudo apt install nodejs npm tmux${C_RESET}"
            ;;
        windows)
            echo "     ${C_DIM}Node.js : https://nodejs.org${C_RESET}"
            echo "     ${C_DIM}tmux : Installer via WSL ou MSYS2${C_RESET}"
            ;;
    esac
    echo ""
    exit 1
fi

INSTALL_STARTED=true  # Pour cleanup_on_error

section "📦 Installation"
echo ""

mkdir -p "$TELEBOT_DIR"
mkdir -p "$TELEBOT_DIR/.claude/skills"

if [ ! -f "$TELEBOT_DIR/.claude/skills.json" ]; then
    echo '{"skills":[]}' > "$TELEBOT_DIR/.claude/skills.json"
fi

if [ -n "$EXISTING_CONFIG" ]; then
    echo "$EXISTING_CONFIG" > "$TELEBOT_DIR/config.env"
fi

download_files() {
    curl -fsSL "$REPO/bot.js" -o "$TELEBOT_DIR/bot.js"
    curl -fsSL "$REPO/package.json" -o "$TELEBOT_DIR/package.json"
    curl -fsSL "$REPO/telebot" -o "$TELEBOT_DIR/telebot"
    chmod +x "$TELEBOT_DIR/telebot"
    mkdir -p "$TELEBOT_DIR/lib"
    curl -fsSL "$REPO/lib/platform.sh" -o "$TELEBOT_DIR/lib/platform.sh"
    curl -fsSL "$REPO/lib/ui.sh" -o "$TELEBOT_DIR/lib/ui.sh"
    curl -fsSL "$REPO/lib/docs.sh" -o "$TELEBOT_DIR/lib/docs.sh"
    curl -fsSL "$REPO/lib/skills.sh" -o "$TELEBOT_DIR/lib/skills.sh"
    curl -fsSL "$REPO/lib/permissions.sh" -o "$TELEBOT_DIR/lib/permissions.sh"
    curl -fsSL "$REPO/settings.json.default" -o "$TELEBOT_DIR/settings.json.default"
    mkdir -p "$TELEBOT_DIR/dist"
    curl -fsSL "$REPO/dist/index.js" -o "$TELEBOT_DIR/dist/index.js"
    curl -fsSL "$REPO/dist/types.js" -o "$TELEBOT_DIR/dist/types.js"
    curl -fsSL "$REPO/dist/config.js" -o "$TELEBOT_DIR/dist/config.js"
    curl -fsSL "$REPO/dist/tmux.js" -o "$TELEBOT_DIR/dist/tmux.js"
    curl -fsSL "$REPO/dist/parser.js" -o "$TELEBOT_DIR/dist/parser.js"
    curl -fsSL "$REPO/dist/utils.js" -o "$TELEBOT_DIR/dist/utils.js"
    curl -fsSL "$REPO/dist/commands.js" -o "$TELEBOT_DIR/dist/commands.js"
    curl -fsSL "$REPO/dist/platform.js" -o "$TELEBOT_DIR/dist/platform.js"
}

install_deps() {
    cd "$TELEBOT_DIR" && npm install --silent
}

install_step 1 4 "Téléchargement" "Téléchargement des fichiers..." download_files
install_step 2 4 "Dépendances" "Installation des dépendances..." install_deps
clear_progress_zone
success "Téléchargement et dépendances OK"
echo ""

section "🔑 Configuration Telegram"
echo ""

echo "  Pour créer ton bot :"
echo ""
echo "    ${C_DIM}1.${C_RESET} Ouvre Telegram"
echo "    ${C_DIM}2.${C_RESET} Cherche ${C_CYAN}@BotFather${C_RESET}"
echo "    ${C_DIM}3.${C_RESET} Envoie ${C_CYAN}/newbot${C_RESET}"
echo "    ${C_DIM}4.${C_RESET} Copie le token (commence par des chiffres)"
echo ""
hr
echo ""

validate_token() {
    local token="$1"
    token=$(echo "$token" | tr -d ' \t\n\r')

    if ! [[ "$token" =~ ^[0-9]+:[A-Za-z0-9_-]{25,}$ ]]; then
        return 1
    fi

    local response
    response=$(curl -fsSL --connect-timeout 5 "https://api.telegram.org/bot$token/getMe" 2>/dev/null)
    if echo "$response" | grep -q '"ok":true'; then
        return 0
    fi
    return 2
}

TELEGRAM_BOT_TOKEN=""
if [ -f "$TELEBOT_DIR/config.env" ]; then
    source "$TELEBOT_DIR/config.env" 2>/dev/null || true
    if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
        menu "  Un token existe déjà. Que faire?" "Garder l'ancien token" "Entrer un nouveau token"
        if [ $? -eq 1 ]; then
            TELEGRAM_BOT_TOKEN=""
        fi
    fi
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    while true; do
        printf "  Token: "
        read_key -r TOKEN

        TOKEN=$(echo "$TOKEN" | tr -d ' \t\n\r')

        if [ -z "$TOKEN" ]; then
            echo ""
            fail "Token requis"
            echo "  ${C_DIM}💡 Copie le token depuis @BotFather${C_RESET}"
            echo ""
            continue
        fi

        if ! [[ "$TOKEN" =~ ^[0-9]+:[A-Za-z0-9_-]{25,}$ ]]; then
            echo ""
            fail "Format de token invalide"
            echo "  ${C_DIM}💡 Format attendu : 123456789:ABCDEFghijklmnop...${C_RESET}"
            echo ""
            continue
        fi

        echo ""
        echo "  ${C_DIM}Vérification du token...${C_RESET}"
        response=$(curl -fsSL --connect-timeout 5 "https://api.telegram.org/bot$TOKEN/getMe" 2>/dev/null)

        if echo "$response" | grep -q '"ok":true'; then
            bot_name=$(echo "$response" | grep -o '"first_name":"[^"]*"' | cut -d'"' -f4)
            echo ""
            success "Token valide"
            [ -n "$bot_name" ] && echo "  ${C_DIM}Bot : @$bot_name${C_RESET}"
            break
        else
            echo ""
            fail "Token invalide ou réseau indisponible"
            echo ""
            menu "  Que faire ?" "Réessayer" "Quitter l'installation"
            if [ $? -eq 1 ]; then
                echo ""
                echo "  ${C_DIM}Installation annulée.${C_RESET}"
                exit 1
            fi
            echo ""
        fi
    done

    SETUP_CODE=$(printf "%08d" $((RANDOM * RANDOM % 100000000)))

    cat > "$TELEBOT_DIR/config.env" << EOF
TELEGRAM_BOT_TOKEN=$TOKEN
TELEGRAM_USER_ID=
SETUP_CODE=$SETUP_CODE
EOF
    echo ""
    success "Configuration enregistrée"
fi

SETUP_CODE=$(grep "SETUP_CODE=" "$TELEBOT_DIR/config.env" 2>/dev/null | cut -d'=' -f2)

if [ ! -f "$TELEBOT_DIR/CLAUDE.md" ]; then
    curl -fsSL "$REPO/CLAUDE.md.default" -o "$TELEBOT_DIR/CLAUDE.md"
fi

if [ ! -f "$TELEBOT_DIR/.claude/settings.json" ]; then
    cp "$TELEBOT_DIR/settings.json.default" "$TELEBOT_DIR/.claude/settings.json"
fi

section "⚙️  Finalisation"
echo ""

install_command() {
    mkdir -p "$BIN_DIR"
    ln -sf "$TELEBOT_DIR/telebot" "$BIN_DIR/telebot"
}

PROGRESS_ZONE_LINES=0
install_step 4 4 "Finalisation" "Installation de la commande telebot..." install_command
clear_progress_zone

if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    SHELL_RC=$(get_shell_rc)

    echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$SHELL_RC"
    export PATH="$BIN_DIR:$PATH"
    success "PATH mis à jour ($SHELL_RC)"
fi

trap - ERR
INSTALL_STARTED=false

echo ""
echo "${C_CYAN}${C_BOLD}╔═════════════════════════════════════════╗${C_RESET}"
echo "${C_CYAN}${C_BOLD}║${C_RESET}                                         ${C_CYAN}${C_BOLD}║${C_RESET}"
echo "${C_CYAN}${C_BOLD}║${C_RESET}     ${C_GREEN}✔ Installation terminée !${C_RESET}          ${C_CYAN}${C_BOLD}║${C_RESET}"
echo "${C_CYAN}${C_BOLD}║${C_RESET}                                         ${C_CYAN}${C_BOLD}║${C_RESET}"
echo "${C_CYAN}${C_BOLD}╚═════════════════════════════════════════╝${C_RESET}"
echo ""

if menu "  ▶️  Démarrer le bot maintenant?" "Oui" "Non"; then
    telebot start
    echo ""
    section "🔐 Activation"
    spaced_code=$(echo "$SETUP_CODE" | sed 's/./&   /g' | sed 's/   $//')
    echo ""
    echo "${C_CYAN}${C_BOLD}╔══════════════════════════════════════════════════════════╗${C_RESET}"
    echo "${C_CYAN}${C_BOLD}║${C_RESET}                                                          ${C_CYAN}${C_BOLD}║${C_RESET}"
    echo "${C_CYAN}${C_BOLD}║${C_RESET}                    ${C_BOLD}CODE D'ACTIVATION${C_RESET}                     ${C_CYAN}${C_BOLD}║${C_RESET}"
    echo "${C_CYAN}${C_BOLD}║${C_RESET}                                                          ${C_CYAN}${C_BOLD}║${C_RESET}"
    echo "${C_CYAN}${C_BOLD}║${C_RESET}            ${C_BOLD}${spaced_code}${C_RESET}                 ${C_CYAN}${C_BOLD}║${C_RESET}"
    echo "${C_CYAN}${C_BOLD}║${C_RESET}                                                          ${C_CYAN}${C_BOLD}║${C_RESET}"
    echo "${C_CYAN}${C_BOLD}║${C_RESET}               ${C_DIM}Entre ce code dans Telegram${C_RESET}                ${C_CYAN}${C_BOLD}║${C_RESET}"
    echo "${C_CYAN}${C_BOLD}║${C_RESET}                                                          ${C_CYAN}${C_BOLD}║${C_RESET}"
    echo "${C_CYAN}${C_BOLD}╚══════════════════════════════════════════════════════════╝${C_RESET}"
    echo ""

    if copy_to_clipboard "$SETUP_CODE"; then
        success "Code copié dans le presse-papiers"
        echo ""
    fi

    echo "  ${C_DIM}Appuie sur Entrée pour ouvrir Telebot...${C_RESET}"
    read_key -rsn1
    exec telebot
else
    echo ""
    echo "  Tu peux démarrer plus tard avec:"
    echo "    ${C_CYAN}telebot start${C_RESET}"
    echo ""
    if [ -n "$SETUP_CODE" ]; then
        echo "  ${C_DIM}Code d'activation: ${C_RESET}${C_CYAN}$SETUP_CODE${C_RESET}"
        echo "  ${C_DIM}(à envoyer sur Telegram après le démarrage)${C_RESET}"
    fi
    echo ""
fi
