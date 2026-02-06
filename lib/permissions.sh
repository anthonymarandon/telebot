#!/usr/bin/env bash
# Telebot - Gestion des permissions Claude Code
# Sourcé par telebot
# Requiert: lib/platform.sh, lib/ui.sh, CLAUDE_DIR, TELEBOT_DIR

SETTINGS_FILE="$CLAUDE_DIR/settings.json"
SETTINGS_DEFAULT="$TELEBOT_DIR/settings.json.default"

has_permissions() {
    [ -f "$SETTINGS_FILE" ]
}

show_permissions() {
    if ! has_permissions; then
        echo "  ${C_DIM}Aucune whitelist configurée.${C_RESET}"
        echo "  ${C_DIM}Claude Code fonctionne en mode normal (demande à chaque action).${C_RESET}"
        return
    fi

    echo "  ${C_BOLD}Outils Claude autorisés :${C_RESET}"
    echo ""

    local tools=""
    tools=$(grep -oE '"(Read|Write|Edit|Glob|Grep|WebFetch|WebSearch|Task|NotebookEdit)"' "$SETTINGS_FILE" 2>/dev/null | tr -d '"' | sort -u)
    if [ -n "$tools" ]; then
        while IFS= read -r tool; do
            echo "    ${C_GREEN}✔${C_RESET} $tool"
        done <<< "$tools"
    else
        echo "    ${C_DIM}(aucun)${C_RESET}"
    fi

    echo ""
    echo "  ${C_BOLD}Commandes Bash autorisées :${C_RESET}"
    echo ""

    local cmds=""
    cmds=$(grep -oE '"Bash\([^)]+\)"' "$SETTINGS_FILE" 2>/dev/null | sed 's/"Bash(\(.*\):\*)"$/\1/' | sed 's/"Bash(\(.*\))"$/\1/' | sort -u)
    if [ -n "$cmds" ]; then
        local count=0
        local line=""
        while IFS= read -r cmd; do
            if [ $count -eq 0 ]; then
                line="    ${C_GREEN}✔${C_RESET} $cmd"
            else
                line="$line, $cmd"
            fi
            ((count++))
            if [ $count -ge 6 ]; then
                echo "$line"
                count=0
                line=""
            fi
        done <<< "$cmds"
        [ -n "$line" ] && echo "$line"
    else
        echo "    ${C_DIM}(aucune)${C_RESET}"
    fi

    echo ""

    local denied=""
    denied=$(grep -oE '"deny":\s*\[[^]]*\]' "$SETTINGS_FILE" 2>/dev/null)
    if echo "$denied" | grep -qv '\[\s*\]'; then
        echo "  ${C_BOLD}${C_RED}Commandes refusées :${C_RESET}"
        echo "  ${C_DIM}$denied${C_RESET}"
        echo ""
    fi

    echo "  ${C_DIM}Fichier : $SETTINGS_FILE${C_RESET}"
}

restore_permissions() {
    if [ ! -f "$SETTINGS_DEFAULT" ]; then
        fail "Fichier par défaut introuvable"
        echo "  ${C_DIM}$SETTINGS_DEFAULT${C_RESET}"
        return 1
    fi
    mkdir -p "$CLAUDE_DIR"
    cp "$SETTINGS_DEFAULT" "$SETTINGS_FILE"
    success "Permissions restaurées par défaut"
}

delete_permissions() {
    if [ -f "$SETTINGS_FILE" ]; then
        rm -f "$SETTINGS_FILE"
        success "Permissions supprimées"
        echo "  ${C_DIM}Claude Code reviendra en mode normal (demande à chaque action).${C_RESET}"
    else
        echo "  ${C_DIM}Aucune whitelist à supprimer.${C_RESET}"
    fi
}

do_permissions_interactive() {
    while true; do
        clear
        logo
        hr
        section "🔐 Gérer les permissions Claude"

        if has_permissions; then
            local tool_count cmd_count
            tool_count=$(grep -oE '"(Read|Write|Edit|Glob|Grep|WebFetch|WebSearch|Task|NotebookEdit)"' "$SETTINGS_FILE" 2>/dev/null | wc -l | tr -d ' ')
            cmd_count=$(grep -oE '"Bash\([^)]+\)"' "$SETTINGS_FILE" 2>/dev/null | wc -l | tr -d ' ')
            echo "  ${C_GREEN}✔${C_RESET} Whitelist active : ${C_BOLD}$tool_count${C_RESET} outils, ${C_BOLD}$cmd_count${C_RESET} commandes Bash"
        else
            echo "  ${C_DIM}⚫ Aucune whitelist (mode normal)${C_RESET}"
        fi
        echo ""

        echo "  ${C_DIM}La whitelist pré-approuve les commandes sûres${C_RESET}"
        echo "  ${C_DIM}pour que Claude ne demande pas à chaque action.${C_RESET}"
        echo "  ${C_DIM}Commandes dangereuses (rm, sudo, kill) restent bloquées.${C_RESET}"
        echo ""
        hr
        echo ""

        menu "  Que veux-tu faire ?" "Voir les permissions actuelles" "Restaurer les permissions par défaut" "Éditer les permissions" "Supprimer les permissions" "Retour"
        local choice=$?

        case $choice in
            0)
                clear
                logo
                hr
                section "🔐 Permissions actuelles"
                show_permissions
                echo ""
                hr
                echo " ${C_DIM}[Entrée] Retour${C_RESET}"
                read_key -rsn1
                ;;
            1)
                echo ""
                if has_permissions; then
                    menu "  Écraser les permissions actuelles ?" "Oui, restaurer" "Annuler"
                    if [ $? -eq 0 ]; then
                        restore_permissions
                    fi
                else
                    restore_permissions
                fi
                sleep 1
                ;;
            2)
                if ! has_permissions; then
                    echo ""
                    echo "  ${C_YELLOW}⚠${C_RESET}  Aucune whitelist. Restaurer les défauts d'abord ?"
                    echo ""
                    menu "" "Oui, créer depuis les défauts" "Annuler"
                    if [ $? -eq 0 ]; then
                        restore_permissions
                        sleep 1
                    else
                        continue
                    fi
                fi
                ${EDITOR:-nano} "$SETTINGS_FILE"
                ;;
            3)
                if has_permissions; then
                    echo ""
                    echo "  ${C_YELLOW}⚠️${C_RESET}  ${C_BOLD}Supprimer la whitelist ?${C_RESET}"
                    echo ""
                    echo "  ${C_DIM}Claude Code demandera une confirmation${C_RESET}"
                    echo "  ${C_DIM}pour chaque action (mode normal).${C_RESET}"
                    echo ""
                    menu "" "Annuler" "Supprimer"
                    if [ $? -eq 1 ]; then
                        delete_permissions
                    fi
                else
                    echo ""
                    echo "  ${C_DIM}Aucune whitelist à supprimer.${C_RESET}"
                fi
                sleep 1
                ;;
            4)
                return 0
                ;;
        esac
    done
}
