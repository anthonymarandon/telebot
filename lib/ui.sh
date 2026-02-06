#!/usr/bin/env bash
# Telebot - Composants UI (couleurs, spinner, menu)
# Sourcé par telebot et install.sh
# Requiert: lib/platform.sh (READ_TIMEOUT, repeat_char, read_key)

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

# Usage: _logo_impl [version_string]
_logo_impl() {
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

# Wrapper par défaut (peut être surchargé par le script appelant)
logo() { _logo_impl "$@"; }

section() {
    echo ""
    printf "  %s%s%s\n" "${C_BOLD}" "$1" "${C_RESET}"
    echo ""
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
    fi
    return $exit_code
}

step_run() {
    local msg=$1
    shift
    "$@" &>/dev/null &
    spinner $! "$msg"
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

pause_return() {
    local seconds=${1:-2}
    for ((i=seconds; i>0; i--)); do
        printf "\r  %sRetour au menu dans %ss...%s  " "${C_DIM}" "$i" "${C_RESET}"
        sleep 1
    done
    printf "\r                                    \r"
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
