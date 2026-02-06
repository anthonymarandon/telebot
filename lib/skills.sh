#!/usr/bin/env bash
# Telebot - Gestion des skills
# Sourcé par telebot
# Requiert: lib/platform.sh, lib/ui.sh, SKILLS_DIR

init_claude_dir() {
    mkdir -p "$SKILLS_DIR"
}

delete_skill() {
    local name="$1"
    rm -rf "$SKILLS_DIR/$name"
}

do_skills_interactive() {
    while true; do
        clear
        logo
        hr
        section "🔧 Gérer les skills"

        init_claude_dir

        local total=0
        local skills_list=""
        local skill_names=()
        if [ -d "$SKILLS_DIR" ]; then
            for skill_dir in "$SKILLS_DIR"/*/; do
                [ -d "$skill_dir" ] || continue
                local skill_file="$skill_dir/SKILL.md"
                [ -f "$skill_file" ] || continue
                ((total++))

                local name
                name=$(basename "$skill_dir")
                skill_names+=("$name")
                local desc=""
                if [ -f "$skill_file" ]; then
                    desc=$(grep -m1 "^description:" "$skill_file" 2>/dev/null | sed 's/description: *//')
                fi
                [ -z "$desc" ] && desc="Skill personnalisé"
                skills_list="${skills_list}  ✅ /${name} - ${desc}\n"
            done
        fi

        echo "  ${C_DIM}Skills : $total installé(s)${C_RESET}"
        echo ""

        if [ "$total" -gt 0 ]; then
            echo "  ${C_BOLD}Skills installés :${C_RESET}"
            echo ""
            printf "%b" "$skills_list"
            echo ""
        fi

        hr
        echo ""

        menu "  Que veux-tu faire ?" "Comment créer un skill" "Ouvrir le dossier skills" "Supprimer un skill" "Éditer un skill" "Retour"
        local choice=$?

        case $choice in
            0)
                clear
                logo
                hr
                section "📝 Comment créer un skill"
                echo ""
                echo "  ${C_DIM}Choisis ton niveau :${C_RESET}"
                echo ""
                menu "" "Mode simple (recommandé)" "Mode développeur" "Retour"
                local mode_choice=$?

                if [ $mode_choice -eq 0 ]; then
                    clear
                    logo
                    hr
                    section "📝 Créer un skill (mode simple)"
                    echo ""
                    echo "  ${C_BOLD}1️⃣  Ouvre le dossier des skills${C_RESET}"
                    echo ""
                    case "$OS_TYPE" in
                        macos)
                            echo "     ${C_DIM}Sur Mac : Finder → Aller → Aller au dossier${C_RESET}"
                            echo "     ${C_DIM}Tape : ${C_CYAN}~/.telebot/.claude/skills${C_RESET}"
                            echo ""
                            echo "     ${C_YELLOW}💡${C_RESET} ${C_DIM}Les fichiers commençant par un point${C_RESET}"
                            echo "        ${C_DIM}sont cachés. Pour les voir :${C_RESET}"
                            echo "        ${C_DIM}Mac : ${C_CYAN}Cmd + Shift + .${C_RESET}"
                            ;;
                        windows)
                            echo "     ${C_DIM}Ouvre l'Explorateur de fichiers${C_RESET}"
                            echo "     ${C_DIM}Va dans : ${C_CYAN}%USERPROFILE%\\.telebot\\.claude\\skills${C_RESET}"
                            echo ""
                            echo "     ${C_YELLOW}💡${C_RESET} ${C_DIM}Active \"Éléments masqués\" dans l'onglet${C_RESET}"
                            echo "        ${C_DIM}Affichage de l'Explorateur${C_RESET}"
                            ;;
                        *)
                            echo "     ${C_DIM}Ouvre ton gestionnaire de fichiers${C_RESET}"
                            echo "     ${C_DIM}Va dans : ${C_CYAN}~/.telebot/.claude/skills${C_RESET}"
                            echo ""
                            echo "     ${C_YELLOW}💡${C_RESET} ${C_DIM}Active l'affichage des fichiers cachés${C_RESET}"
                            echo "        ${C_DIM}dans les préférences (Ctrl+H parfois)${C_RESET}"
                            ;;
                    esac
                    echo ""
                    echo "  ${C_BOLD}2️⃣  Copie un skill existant${C_RESET}"
                    echo ""
                    echo "     ${C_DIM}Duplique un dossier de skill (ex: \"apex\")${C_RESET}"
                    echo "     ${C_DIM}Renomme-le avec le nom de ton skill${C_RESET}"
                    echo ""
                    echo "  ${C_BOLD}3️⃣  Modifie le fichier SKILL.md${C_RESET}"
                    echo ""
                    echo "     ${C_DIM}Ouvre SKILL.md avec un éditeur de texte${C_RESET}"
                    echo "     ${C_DIM}(TextEdit, VS Code, ou autre)${C_RESET}"
                    echo ""
                    echo "     ${C_DIM}Change le nom et la description en haut :${C_RESET}"
                    echo "     ${C_CYAN}┌─────────────────────────────────┐${C_RESET}"
                    echo "     ${C_CYAN}│${C_RESET} ${C_DIM}---${C_RESET}                             ${C_CYAN}│${C_RESET}"
                    echo "     ${C_CYAN}│${C_RESET} ${C_DIM}name: mon-skill${C_RESET}                 ${C_CYAN}│${C_RESET}"
                    echo "     ${C_CYAN}│${C_RESET} ${C_DIM}description: Ce que fait le skill${C_RESET}${C_CYAN}│${C_RESET}"
                    echo "     ${C_CYAN}│${C_RESET} ${C_DIM}---${C_RESET}                             ${C_CYAN}│${C_RESET}"
                    echo "     ${C_CYAN}└─────────────────────────────────┘${C_RESET}"
                    echo ""
                    echo "  ${C_BOLD}4️⃣  Écris les instructions${C_RESET}"
                    echo ""
                    echo "     ${C_DIM}Décris ce que Claude doit faire quand${C_RESET}"
                    echo "     ${C_DIM}tu tapes /mon-skill${C_RESET}"
                    echo ""
                    hr
                    echo ""
                    echo "  ${C_GREEN}✨${C_RESET} ${C_BOLD}C'est tout !${C_RESET} ${C_DIM}Le skill sera disponible${C_RESET}"
                    echo "     ${C_DIM}automatiquement dans Telebot.${C_RESET}"
                    echo ""
                    hr
                    echo " ${C_DIM}[Entrée] Retour${C_RESET}"
                    read_key -rsn1
                elif [ $mode_choice -eq 1 ]; then
                    clear
                    logo
                    hr
                    section "📝 Créer un skill (mode développeur)"
                    echo ""
                    echo "  ${C_BOLD}1. Crée le dossier du skill :${C_RESET}"
                    echo ""
                    echo "     ${C_CYAN}mkdir -p ~/.telebot/.claude/skills/mon-skill${C_RESET}"
                    echo ""
                    echo "  ${C_BOLD}2. Crée le fichier SKILL.md :${C_RESET}"
                    echo ""
                    echo "     ${C_DIM}Structure requise :${C_RESET}"
                    echo ""
                    echo "     ${C_CYAN}---${C_RESET}"
                    echo "     ${C_CYAN}name: mon-skill${C_RESET}"
                    echo "     ${C_CYAN}description: Description courte${C_RESET}"
                    echo "     ${C_CYAN}---${C_RESET}"
                    echo ""
                    echo "     ${C_CYAN}# /mon-skill${C_RESET}"
                    echo ""
                    echo "     ${C_CYAN}## Quand utiliser${C_RESET}"
                    echo "     ${C_CYAN}- Contexte d'utilisation${C_RESET}"
                    echo ""
                    echo "     ${C_CYAN}## Actions${C_RESET}"
                    echo "     ${C_CYAN}1. Première action${C_RESET}"
                    echo "     ${C_CYAN}2. Deuxième action${C_RESET}"
                    echo ""
                    echo "  ${C_BOLD}3. Dossier des skills :${C_RESET}"
                    echo "     ${C_GREEN}$SKILLS_DIR${C_RESET}"
                    echo ""
                    echo "  ${C_YELLOW}💡${C_RESET} ${C_DIM}Copie un skill existant comme base${C_RESET}"
                    echo ""
                    hr
                    echo " ${C_DIM}[Entrée] Retour${C_RESET}"
                    read_key -rsn1
                fi
                ;;
            1)
                init_claude_dir
                echo ""
                if open_path "$SKILLS_DIR"; then
                    success "Dossier ouvert"
                else
                    echo "  ${C_BOLD}Dossier des skills :${C_RESET}"
                    echo "  ${C_GREEN}$SKILLS_DIR${C_RESET}"
                fi
                sleep 1
                ;;
            2)
                if [ "$total" -eq 0 ]; then
                    echo ""
                    fail "Aucun skill à supprimer"
                    sleep 1
                    continue
                fi

                clear
                logo
                hr
                section "🗑️  Supprimer un skill"
                echo ""
                echo "  ${C_DIM}Quel skill veux-tu supprimer ?${C_RESET}"
                echo ""

                local menu_items=()
                for sname in "${skill_names[@]}"; do
                    menu_items+=("/$sname")
                done
                menu_items+=("← Annuler")

                menu "" "${menu_items[@]}"
                local del_choice=$?

                if [ $del_choice -lt ${#skill_names[@]} ]; then
                    local skill_to_delete="${skill_names[$del_choice]}"
                    echo ""
                    hr
                    echo ""
                    echo "  ${C_YELLOW}⚠️${C_RESET}  ${C_BOLD}Supprimer /$skill_to_delete ?${C_RESET}"
                    echo ""
                    echo "  ${C_DIM}Cette action est irréversible.${C_RESET}"
                    echo "  ${C_DIM}Le dossier et son contenu seront supprimés.${C_RESET}"
                    echo ""
                    menu "" "Annuler" "Supprimer définitivement"
                    if [ $? -eq 1 ]; then
                        delete_skill "$skill_to_delete"
                        echo ""
                        success "Skill /$skill_to_delete supprimé"
                        sleep 1
                    fi
                fi
                ;;
            3)
                if [ "$total" -eq 0 ]; then
                    echo ""
                    fail "Aucun skill à éditer"
                    sleep 1
                    continue
                fi

                clear
                logo
                hr
                section "✏️  Éditer un skill"
                echo ""
                echo "  ${C_DIM}Quel skill veux-tu éditer ?${C_RESET}"
                echo ""

                local menu_items=()
                for sname in "${skill_names[@]}"; do
                    menu_items+=("/$sname")
                done
                menu_items+=("← Annuler")

                menu "" "${menu_items[@]}"
                local edit_choice=$?

                if [ $edit_choice -lt ${#skill_names[@]} ]; then
                    local skill_to_edit="${skill_names[$edit_choice]}"
                    ${EDITOR:-nano} "$SKILLS_DIR/$skill_to_edit/SKILL.md"
                fi
                ;;
            4)
                return 0
                ;;
        esac
    done
}
