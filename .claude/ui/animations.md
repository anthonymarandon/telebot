# Animations

Toutes les animations utilisées dans Telebot.

## Spinner (chargement)

```bash
frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")

# Affichage
⠋ Téléchargement en cours...
⠙ Téléchargement en cours...
⠹ Téléchargement en cours...
```

### Implémentation

```bash
spinner() {
    local pid=$1
    local msg=$2
    local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
    local i=0

    tput civis 2>/dev/null || true
    while kill -0 $pid 2>/dev/null; do
        printf "\r  ${C_BLUE}${frames[$i]}${C_RESET} $msg"
        i=$(( (i + 1) % 10 ))
        sleep 0.1
    done
    wait $pid
    local exit_code=$?
    tput cnorm 2>/dev/null || true

    if [ $exit_code -eq 0 ]; then
        printf "\r  ${C_GREEN}✔${C_RESET} $msg\n"
    else
        printf "\r  ${C_RED}✖${C_RESET} $msg\n"
    fi
    return $exit_code
}
```

## Barre de progression

```
[░░░░░░░░░░░░░░░░░░░░░░░░░░]   0%
[████░░░░░░░░░░░░░░░░░░░░░░]  15%
[████████░░░░░░░░░░░░░░░░░░]  30%
[████████████░░░░░░░░░░░░░░]  45%
[████████████████░░░░░░░░░░]  60%
[████████████████████░░░░░░]  75%
[████████████████████████░░]  90%
[██████████████████████████] 100%
```

### Implémentation

```bash
progress_bar() {
    local progress=$1
    local total=$2
    local width=26
    local filled=$((progress * width / total))
    local empty=$((width - filled))
    printf "\r  ["
    printf "%${filled}s" | tr ' ' '█'
    printf "%${empty}s" | tr ' ' '░'
    printf "] %3d%%" $((progress * 100 / total))
}
```

## Progression dynamique (installation)

Barre de progression avec étapes numérotées, mise à jour in-place.

### Affichage

```
[████████████████░░░░░░░░░░░░░░] 2/4 Dépendances
✔ Téléchargement des fichiers
⠋ Installation des dépendances...
```

### Implémentation

```bash
# Barre de progression inline (sans retour à la ligne)
progress_bar_inline() {
    local current=$1
    local total=$2
    local label=$3
    local width=30
    local filled=$((current * width / total))
    local empty=$((width - filled))

    printf "  ${C_CYAN}[${C_RESET}"
    local f=0
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

# Met à jour la progression en effaçant les lignes précédentes
update_install_progress() {
    local step=$1
    local total=$2
    local label=$3
    local prev_status=$4

    # Remonte et efface les lignes précédentes
    if [ $INSTALL_STATUS_LINES -gt 0 ]; then
        tput cuu $INSTALL_STATUS_LINES 2>/dev/null
        local l=0
        while [ $l -lt $INSTALL_STATUS_LINES ]; do
            tput el 2>/dev/null
            tput cud1 2>/dev/null
            l=$((l + 1))
        done
        tput cuu $INSTALL_STATUS_LINES 2>/dev/null
    fi

    # Affiche la nouvelle barre
    progress_bar_inline "$step" "$total" "$label"
    echo ""

    # Affiche le statut précédent comme terminé
    if [ -n "$prev_status" ]; then
        printf "  ${C_GREEN}✔${C_RESET} %s\n" "$prev_status"
        INSTALL_STATUS_LINES=2
    else
        INSTALL_STATUS_LINES=1
    fi
}
```

### Comportement

1. La barre se met à jour **sur la même ligne** à chaque étape
2. L'étape terminée s'affiche brièvement puis est remplacée par la suivante
3. Le spinner tourne sous la barre pendant le traitement
4. Résultat : écran épuré, feedback clair

## Checklist animée

```
# Étape terminée
✔ Téléchargement des fichiers

# Étape en cours
⠋ Installation des dépendances...

# Étape à venir
○ Finalisation
```

## Typing effect (optionnel)

```bash
type_text() {
    local text="$1"
    local delay=${2:-0.02}
    for ((i=0; i<${#text}; i++)); do
        printf "%s" "${text:$i:1}"
        sleep $delay
    done
    echo
}
```

## Flash effect (optionnel)

```bash
flash() {
    local text="$1"
    local color="$2"
    for i in {1..2}; do
        printf "\r${color}${text}${RESET}"
        sleep 0.15
        printf "\r%${#text}s"
        sleep 0.1
    done
    printf "\r${color}${text}${RESET}\n"
}
```

## Compte à rebours (retour menu)

```
Retour au menu dans 3s...
Retour au menu dans 2s...
Retour au menu dans 1s...
```

### Implémentation

```bash
pause_return() {
    local seconds=${1:-2}
    for ((i=seconds; i>0; i--)); do
        printf "\r  ${C_DIM}Retour au menu dans ${i}s...${C_RESET}  "
        sleep 1
    done
    printf "\r                                    \r"
}
```
