#!/usr/bin/env bash
# Telebot - Écrans de documentation et aide
# Sourcé par telebot
# Requiert: lib/platform.sh, lib/ui.sh, TELEBOT_DIR, LOG_FILE

do_help_interactive() {
    clear
    logo
    hr
    section "❓ Aide / FAQ"

    echo "  ${C_BOLD}Problèmes courants :${C_RESET}"
    echo ""
    echo "  ${C_CYAN}1.${C_RESET} ${C_BOLD}Le bot ne répond pas sur Telegram${C_RESET}"
    echo "     ${C_DIM}→ Vérifie que le bot est démarré (🤖 Bot: ON)${C_RESET}"
    echo "     ${C_DIM}→ Vérifie que tu as activé le bot avec le code${C_RESET}"
    echo ""
    echo "  ${C_CYAN}2.${C_RESET} ${C_BOLD}Claude ne répond pas${C_RESET}"
    echo "     ${C_DIM}→ Vérifie que Claude est actif (📟 Claude: ON)${C_RESET}"
    echo "     ${C_DIM}→ Envoie /restart sur Telegram puis un message${C_RESET}"
    echo ""
    echo "  ${C_CYAN}3.${C_RESET} ${C_BOLD}Le code d'activation ne fonctionne pas${C_RESET}"
    echo "     ${C_DIM}→ Le code doit être envoyé au bot, pas à @BotFather${C_RESET}"
    echo "     ${C_DIM}→ Vérifie que le bot est bien démarré ici${C_RESET}"
    echo ""
    echo "  ${C_CYAN}4.${C_RESET} ${C_BOLD}Erreur \"Token invalide\"${C_RESET}"
    echo "     ${C_DIM}→ Recopie le token depuis @BotFather${C_RESET}"
    echo "     ${C_DIM}→ Utilise \"Réinitialiser la configuration\"${C_RESET}"
    echo ""
    echo "  ${C_CYAN}5.${C_RESET} ${C_BOLD}Sessions tmux multiples${C_RESET}"
    echo "     ${C_DIM}→ Utilise \"Stopper sessions tmux\" pour nettoyer${C_RESET}"
    echo ""
    hr
    echo ""
    echo "  ${C_BOLD}Liens utiles :${C_RESET}"
    echo ""
    echo "  ${C_DIM}GitHub :${C_RESET}  ${C_CYAN}github.com/anthonymarandon/telebot${C_RESET}"
    echo "  ${C_DIM}Créer un bug :${C_RESET}  ${C_CYAN}github.com/anthonymarandon/telebot/issues${C_RESET}"
    echo ""
    hr
    echo " ${C_DIM}[Entrée] Retour${C_RESET}"
    read_key -rsn1
}

show_doc_prereqs() {
    clear
    logo
    hr
    section "📋 Prérequis"

    echo "  ${C_BOLD}Telebot nécessite :${C_RESET}"
    echo ""
    echo "    ${C_GREEN}✓${C_RESET} Node.js ${C_DIM}(v18+)${C_RESET}"
    echo "    ${C_GREEN}✓${C_RESET} npm ${C_DIM}(inclus avec Node.js)${C_RESET}"
    echo "    ${C_GREEN}✓${C_RESET} tmux ${C_DIM}(terminal multiplexer)${C_RESET}"
    echo "    ${C_GREEN}✓${C_RESET} Claude Code ${C_DIM}(CLI Anthropic)${C_RESET}"
    echo ""
    hr
    echo ""

    case "$OS_TYPE" in
        macos)
            echo "  ${C_CYAN}${C_BOLD}Installation sur macOS${C_RESET}"
            echo ""
            echo "  ${C_BOLD}1. Homebrew${C_RESET} ${C_DIM}(si pas installé)${C_RESET}"
            echo "     ${C_CYAN}/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"${C_RESET}"
            echo ""
            echo "  ${C_BOLD}2. Node.js + tmux${C_RESET}"
            echo "     ${C_CYAN}brew install node tmux${C_RESET}"
            echo ""
            echo "  ${C_BOLD}3. Claude Code${C_RESET}"
            echo "     ${C_CYAN}npm install -g @anthropic-ai/claude-code${C_RESET}"
            echo ""
            echo "  ${C_BOLD}4. Vérifier l'installation${C_RESET}"
            echo "     ${C_CYAN}node --version && tmux -V && claude --version${C_RESET}"
            ;;
        linux)
            echo "  ${C_CYAN}${C_BOLD}Installation sur Linux${C_RESET}"
            echo ""
            echo "  ${C_BOLD}Ubuntu/Debian :${C_RESET}"
            echo "     ${C_CYAN}sudo apt update${C_RESET}"
            echo "     ${C_CYAN}sudo apt install nodejs npm tmux${C_RESET}"
            echo ""
            echo "  ${C_BOLD}Fedora :${C_RESET}"
            echo "     ${C_CYAN}sudo dnf install nodejs npm tmux${C_RESET}"
            echo ""
            echo "  ${C_BOLD}Arch Linux :${C_RESET}"
            echo "     ${C_CYAN}sudo pacman -S nodejs npm tmux${C_RESET}"
            echo ""
            echo "  ${C_BOLD}Claude Code :${C_RESET}"
            echo "     ${C_CYAN}npm install -g @anthropic-ai/claude-code${C_RESET}"
            ;;
        windows)
            echo "  ${C_CYAN}${C_BOLD}Installation sur Windows${C_RESET}"
            echo ""
            echo "  ${C_YELLOW}⚠️${C_RESET}  ${C_DIM}Telebot fonctionne via WSL ou Git Bash${C_RESET}"
            echo ""
            echo "  ${C_BOLD}Option 1 : WSL (recommandé)${C_RESET}"
            echo "     ${C_DIM}1. Installer WSL :${C_RESET}"
            echo "        ${C_CYAN}wsl --install${C_RESET}"
            echo "     ${C_DIM}2. Dans WSL, suivre les instructions Linux${C_RESET}"
            echo ""
            echo "  ${C_BOLD}Option 2 : Git Bash + Node.js natif${C_RESET}"
            echo "     ${C_DIM}1. Node.js :${C_RESET} ${C_CYAN}https://nodejs.org${C_RESET}"
            echo "     ${C_DIM}2. Git Bash :${C_RESET} ${C_CYAN}https://git-scm.com${C_RESET}"
            echo "     ${C_DIM}3. tmux via MSYS2 :${C_RESET} ${C_CYAN}https://www.msys2.org${C_RESET}"
            echo ""
            echo "  ${C_BOLD}Claude Code :${C_RESET}"
            echo "     ${C_CYAN}npm install -g @anthropic-ai/claude-code${C_RESET}"
            ;;
        *)
            echo "  ${C_DIM}OS non reconnu. Consultez la documentation en ligne.${C_RESET}"
            ;;
    esac

    echo ""
    hr
    echo " ${C_DIM}[Entrée] Retour${C_RESET}"
    read_key -rsn1
}

show_doc_telegram() {
    clear
    logo
    hr
    section "🤖 Créer un bot Telegram"

    echo "  ${C_BOLD}Étapes pour créer ton bot :${C_RESET}"
    echo ""
    echo "  ${C_GREEN}1.${C_RESET} Ouvre Telegram et cherche ${C_CYAN}@BotFather${C_RESET}"
    echo ""
    echo "  ${C_GREEN}2.${C_RESET} Envoie la commande ${C_CYAN}/newbot${C_RESET}"
    echo ""
    echo "  ${C_GREEN}3.${C_RESET} Choisis un ${C_BOLD}nom${C_RESET} pour ton bot"
    echo "     ${C_DIM}Ex: Mon Assistant Claude${C_RESET}"
    echo ""
    echo "  ${C_GREEN}4.${C_RESET} Choisis un ${C_BOLD}username${C_RESET} (doit finir par 'bot')"
    echo "     ${C_DIM}Ex: mon_claude_bot${C_RESET}"
    echo ""
    echo "  ${C_GREEN}5.${C_RESET} Copie le ${C_BOLD}token${C_RESET} qui ressemble à :"
    echo "     ${C_CYAN}123456789:ABCDefGHIjklMNOpqrsTUVwxyz${C_RESET}"
    echo ""
    hr
    echo ""
    echo "  ${C_YELLOW}💡${C_RESET} ${C_BOLD}Conseils :${C_RESET}"
    echo ""
    echo "  • Le token est ${C_RED}secret${C_RESET}, ne le partage jamais"
    echo "  • Tu peux régénérer le token avec ${C_CYAN}/revoke${C_RESET}"
    echo "  • Personnalise ton bot avec ${C_CYAN}/setdescription${C_RESET}"
    echo "  • Ajoute une photo avec ${C_CYAN}/setuserpic${C_RESET}"
    echo ""
    hr
    echo " ${C_DIM}[Entrée] Retour${C_RESET}"
    read_key -rsn1
}

show_doc_usage() {
    clear
    logo
    hr
    section "📱 Utilisation de Telebot"

    echo "  ${C_BOLD}1. Démarrer le bot${C_RESET}"
    echo "     ${C_DIM}Dans ce menu : \"Démarrer le bot\"${C_RESET}"
    echo "     ${C_DIM}Ou en ligne de commande :${C_RESET} ${C_CYAN}telebot start${C_RESET}"
    echo ""
    echo "  ${C_BOLD}2. Activer le bot${C_RESET}"
    echo "     ${C_DIM}Envoie le code d'activation à ton bot Telegram${C_RESET}"
    echo "     ${C_DIM}(affiché lors du premier démarrage)${C_RESET}"
    echo ""
    echo "  ${C_BOLD}3. Commandes Telegram${C_RESET}"
    echo ""
    echo "     ${C_CYAN}/start${C_RESET}   ${C_DIM}Démarrer une session Claude${C_RESET}"
    echo "     ${C_CYAN}/restart${C_RESET} ${C_DIM}Redémarrer la session${C_RESET}"
    echo "     ${C_CYAN}/yolo${C_RESET}    ${C_DIM}Mode sans permissions${C_RESET} ${C_RED}⚠️${C_RESET}"
    echo "     ${C_CYAN}/stop${C_RESET}    ${C_DIM}Arrêter la session${C_RESET}"
    echo "     ${C_CYAN}/help${C_RESET}    ${C_DIM}Afficher l'aide${C_RESET}"
    echo ""
    hr
    echo ""
    echo "  ${C_BOLD}4. Envoyer des messages${C_RESET}"
    echo "     ${C_DIM}Écris simplement ton message à Claude !${C_RESET}"
    echo "     ${C_DIM}Il répondra directement dans Telegram.${C_RESET}"
    echo ""
    echo "  ${C_BOLD}5. Permissions${C_RESET}"
    echo "     ${C_DIM}Claude demandera des autorisations pour${C_RESET}"
    echo "     ${C_DIM}certaines actions (fichiers, commandes...).${C_RESET}"
    echo "     ${C_DIM}Réponds 1, 2 ou 3 pour autoriser/refuser.${C_RESET}"
    echo ""
    hr
    echo " ${C_DIM}[Entrée] Retour${C_RESET}"
    read_key -rsn1
}

show_doc_config() {
    clear
    logo
    hr
    section "⚙️  Configuration"

    echo "  ${C_BOLD}Fichiers de configuration :${C_RESET}"
    echo ""
    echo "  ${C_CYAN}~/.telebot/config.env${C_RESET}"
    echo "     ${C_DIM}Token Telegram et User ID${C_RESET}"
    echo ""
    echo "  ${C_CYAN}~/.telebot/CLAUDE.md${C_RESET}"
    echo "     ${C_DIM}Instructions personnalisées pour Claude${C_RESET}"
    echo "     ${C_DIM}(prompt système, format des réponses...)${C_RESET}"
    echo ""
    hr
    echo ""
    echo "  ${C_BOLD}Personnaliser Claude :${C_RESET}"
    echo ""
    echo "  ${C_DIM}Édite${C_RESET} ${C_CYAN}~/.telebot/CLAUDE.md${C_RESET} ${C_DIM}pour :${C_RESET}"
    echo ""
    echo "  • Changer le ton des réponses"
    echo "  • Ajouter des règles spécifiques"
    echo "  • Définir des raccourcis"
    echo "  • Configurer des projets par défaut"
    echo ""
    hr
    echo ""
    echo "  ${C_BOLD}Skills (commandes personnalisées) :${C_RESET}"
    echo ""
    echo "  ${C_DIM}Dossier :${C_RESET} ${C_CYAN}~/.telebot/.claude/skills/${C_RESET}"
    echo ""
    echo "  ${C_DIM}Chaque skill est un dossier avec un fichier${C_RESET}"
    echo "  ${C_CYAN}SKILL.md${C_RESET} ${C_DIM}contenant les instructions.${C_RESET}"
    echo ""
    echo "  ${C_DIM}Utilise \"Gérer les skills\" dans le menu${C_RESET}"
    echo "  ${C_DIM}pour créer et gérer tes skills.${C_RESET}"
    echo ""
    hr
    echo " ${C_DIM}[Entrée] Retour${C_RESET}"
    read_key -rsn1
}

do_docs_interactive() {
    while true; do
        clear
        logo
        hr
        section "📚 Documentation"

        echo "  ${C_DIM}Ton système : ${C_RESET}${C_CYAN}${C_BOLD}"
        case "$OS_TYPE" in
            macos)   echo "macOS${C_RESET}" ;;
            linux)   echo "Linux${C_RESET}" ;;
            windows) echo "Windows${C_RESET}" ;;
            *)       echo "Inconnu${C_RESET}" ;;
        esac
        echo ""
        hr
        echo ""

        menu "  Que veux-tu consulter ?" \
            "Prérequis et installation" \
            "Créer un bot Telegram" \
            "Utilisation de Telebot" \
            "Configuration avancée" \
            "← Retour"
        local choice=$?

        case $choice in
            0) show_doc_prereqs ;;
            1) show_doc_telegram ;;
            2) show_doc_usage ;;
            3) show_doc_config ;;
            4) return 0 ;;
        esac
    done
}

do_changelog_interactive() {
    clear
    logo
    hr
    section "📋 Nouveautés"

    local changelog_file="$TELEBOT_DIR/CHANGELOG.md"
    if [ ! -f "$changelog_file" ]; then
        curl -fsSL "https://raw.githubusercontent.com/anthonymarandon/telebot/main/CHANGELOG.md" -o "$changelog_file" 2>/dev/null
    fi

    if [ -f "$changelog_file" ]; then
        local count=0
        local in_version=false
        while IFS= read -r line; do
            if [[ "$line" =~ ^##\ \[.*\] ]]; then
                ((count++))
                [ $count -gt 5 ] && break
                in_version=true
                local version_info="${line#\#\# }"
                echo ""
                echo "  ${C_CYAN}${C_BOLD}$version_info${C_RESET}"
                echo "  ${C_CYAN}─────────────────────────────${C_RESET}"
            elif [ "$in_version" = true ]; then
                if [[ "$line" =~ ^### ]]; then
                    local category="${line#\#\#\# }"
                    local icon=""
                    case "$category" in
                        Ajouté*) icon="✨" ;;
                        Corrigé*) icon="🔧" ;;
                        Amélioré*) icon="⬆️ " ;;
                        *) icon="📌" ;;
                    esac
                    echo ""
                    echo "  ${C_YELLOW}${icon} ${category}${C_RESET}"
                elif [[ "$line" =~ ^-\ \*\* ]]; then
                    local content="${line#- }"
                    if [[ "$content" =~ ^\*\*([^*]+)\*\*[[:space:]]*:[[:space:]]*(.*) ]]; then
                        local title="${BASH_REMATCH[1]}"
                        local desc="${BASH_REMATCH[2]}"
                        desc="${desc//\`/}"
                        echo "    ${C_GREEN}▸${C_RESET} ${C_BOLD}${title}${C_RESET}"
                        echo "      ${C_DIM}${desc}${C_RESET}"
                    else
                        content="${content//\*\*/}"
                        content="${content//\`/}"
                        echo "    ${C_GREEN}▸${C_RESET} ${content}"
                    fi
                elif [[ "$line" =~ ^- ]]; then
                    local content="${line#- }"
                    content="${content//\`/}"
                    echo "    ${C_GREEN}▸${C_RESET} ${content}"
                elif [[ "$line" == "---" ]]; then
                    :
                fi
            fi
        done < "$changelog_file"
    else
        echo "  ${C_DIM}Changelog non disponible${C_RESET}"
    fi

    echo ""
    echo ""
    hr
    echo " ${C_DIM}[Entrée] Retour${C_RESET}"
    read_key -rsn1
}

do_logs_interactive() {
    while true; do
        clear
        logo
        hr
        section "📜 Logs"

        if [ -f "$LOG_FILE" ]; then
            local log_size
            log_size=$(du -h "$LOG_FILE" 2>/dev/null | cut -f1)
            echo "  ${C_DIM}Taille : $log_size${C_RESET}"
            echo ""
            tail -30 "$LOG_FILE" | while read -r line; do
                echo "  ${C_DIM}$line${C_RESET}"
            done
        else
            echo "  ${C_DIM}Pas de logs${C_RESET}"
        fi

        echo ""
        hr
        echo " ${C_DIM}[R] Retour  [F] Suivre en temps réel  [C] Effacer${C_RESET}"

        IFS= read_key -rsn1 key
        case $key in
            r|R) break ;;
            f|F)
                clear
                echo "  ${C_DIM}(Ctrl+C pour revenir)${C_RESET}"
                echo ""
                tail -f "$LOG_FILE" 2>/dev/null || echo "Pas de logs"
                ;;
            c|C)
                echo ""
                echo "  ${C_YELLOW}⚠️  Effacer tous les logs ?${C_RESET}"
                echo "  ${C_DIM}Cette action est irréversible.${C_RESET}"
                echo ""
                echo "  ${C_DIM}[O] Oui  [N] Non${C_RESET}"
                IFS= read_key -rsn1 confirm
                if [[ "$confirm" == "o" || "$confirm" == "O" ]]; then
                    true > "$LOG_FILE"
                    echo ""
                    success "Logs effacés"
                    sleep 1
                fi
                ;;
        esac
    done
}
