# Telebot - Interface Utilisateur

Guide visuel et animations pour toutes les interactions.

---

## 🎨 Thème Global

### Bannière principale (utilisée partout)

```
   ══════════════════════════════════════════════════════════════
      ████████╗███████╗██╗     ███████╗██████╗  ██████╗ ████████╗
      ╚══██╔══╝██╔════╝██║     ██╔════╝██╔══██╗██╔═══██╗╚══██╔══╝
         ██║   █████╗  ██║     █████╗  ██████╔╝██║   ██║   ██║
         ██║   ██╔══╝  ██║     ██╔══╝  ██╔══██╗██║   ██║   ██║
         ██║   ███████╗███████╗███████╗██████╔╝╚██████╔╝   ██║
         ╚═╝   ╚══════╝╚══════╝╚══════╝╚═════╝  ╚═════╝    ╚═╝
   ══════════════════════════════════════════════════════════════
                    🤖 Claude Code × Telegram
                           v1.x.x
```

- Séparateurs (══) : `cyan`
- Texte TELEBOT : `cyan`
- Slogan et version : `dim`
- Pas d'encadré (meilleure compatibilité écrans étroits)

### Séparateurs

```
─────────────────────────────────────────
```

### Encadré simple

```
┌─────────────────────────────────────────┐
│                                         │
│              CONTENU                    │
│                                         │
└─────────────────────────────────────────┘
```

### Encadré code/important

```
╔═════════════════════════════════════════╗
║                                         ║
║              CONTENU                    ║
║                                         ║
╚═════════════════════════════════════════╝
```

---

## 🎬 Animations

### Spinner (pendant chargement)

```bash
# Style dots (préféré)
frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")

# Exemple d'affichage
⠋ Téléchargement en cours...
⠙ Téléchargement en cours...
⠹ Téléchargement en cours...
```

### Barre de progression

```
# Style moderne
[████████████░░░░░░░░░░░░░░] 45%

# Animation
[░░░░░░░░░░░░░░░░░░░░░░░░░░]   0%
[████░░░░░░░░░░░░░░░░░░░░░░]  15%
[████████░░░░░░░░░░░░░░░░░░]  30%
[████████████░░░░░░░░░░░░░░]  45%
[████████████████░░░░░░░░░░]  60%
[████████████████████░░░░░░]  75%
[████████████████████████░░]  90%
[██████████████████████████] 100%
```

### Effet de typing (texte progressif)

```bash
# Le texte s'affiche caractère par caractère
# Délai: 0.02s entre chaque caractère

B...
Bi...
Bie...
Bien...
Bienv...
Bienve...
Bienven...
Bienvenu...
Bienvenue...
Bienvenue ...
Bienvenue !
```

### Checklist animée

```
# Étape en cours (spinner)
⠋ Installation des dépendances...

# Étape terminée (apparaît avec délai)
✔ Installation des dépendances

# Séquence complète
✔ Téléchargement des fichiers
✔ Installation des dépendances
⠋ Configuration...
○ Finalisation
```

### Succès / Erreur (flash)

```bash
# Succès: texte vert qui clignote 2x puis reste
✔ Opération réussie !

# Erreur: texte rouge qui clignote 2x puis reste
✖ Erreur: fichier non trouvé
```

---

## 1. Installation (`install.sh`)

### Séquence complète

L'installation utilise le logo moderne dans un encadré cyan.
Voir la section "Bannière principale" pour le logo complet.

```
─────────────────────────────────────────

⠋ Vérification des prérequis...
```

### Prérequis (animation checklist)

```
─────────────────────────────────────────

📋 Prérequis

  ✔ Node.js        v20.10.0
  ✔ npm            v10.2.3
  ✔ tmux           3.4
  ✔ Claude Code    v2.1.29

─────────────────────────────────────────
```

### Prérequis manquant

```
📋 Prérequis

  ✔ Node.js        v20.10.0
  ✔ npm            v10.2.3
  ✖ tmux           non trouvé
  ○ Claude Code    -

─────────────────────────────────────────

💡 Installation requise :

   brew install tmux

─────────────────────────────────────────
```

### Configuration Token

```
🔑 Configuration Telegram

  Pour créer ton bot :

    1. Ouvre Telegram
    2. Cherche @BotFather
    3. Envoie /newbot
    4. Copie le token

─────────────────────────────────────────

  Token: █
```

### Installation (progression dynamique)

La zone d'installation utilise un affichage dynamique :
- Une seule barre de progression qui se met à jour in-place
- Les étapes s'effacent une fois terminées
- L'écran reste épuré

```
📦 Installation

  [████████████████░░░░░░░░░░░░░░] 2/4 Dépendances
  ✔ Téléchargement des fichiers
  ⠋ Installation des dépendances...
```

Puis (après mise à jour) :

```
📦 Installation

  [████████████████████████░░░░░░] 3/4 Configuration
  ✔ Installation des dépendances
```

### Fin d'installation

```
╔═════════════════════════════════════════╗
║                                         ║
║        ✔ Installation terminée !        ║
║                                         ║
╚═════════════════════════════════════════╝

▶️  Démarrer le bot maintenant ?

    ┌───────────────────────────────────┐
    │ ▶ Oui                             │
    └───────────────────────────────────┘
       Non
```

### Code d'activation

```
🔐 Activation

╔══════════════════════════════════════════════════════════╗
║                                                          ║
║                    CODE D'ACTIVATION                     ║
║                                                          ║
║            1   2   3   4   5   6   7   8                 ║
║                                                          ║
║               Entre ce code dans Telegram                ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

  Appuie sur Entrée pour ouvrir Telebot...
```

---

## 2. Navigation TUI (Interface Persistante)

### Concept

L'application reste ouverte en permanence. L'utilisateur navigue entre les écrans sans jamais quitter le terminal.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ZONE CONTENU                         │
│                   (change selon                         │
│                    l'écran actif)                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [↑↓] Naviguer   [Entrée] Sélectionner   [Q] Quitter   │
└─────────────────────────────────────────────────────────┘
```

### Flux de navigation

```
┌──────────────┐
│ Menu Principal│
└──────┬───────┘
       │
       ├──► Démarrer ──► Retour auto
       ├──► Arrêter ──► Retour auto
       ├──► Logs ──────► [Retour] revient au menu
       ├──► Config ────► [Retour] revient au menu
       ├──► Instructions ► [Retour] revient au menu
       ├──► Mise à jour ─► Sous-menu ──► Retour auto
       ├──► Skills ──────► Sous-menu ──► Retour
       ├──► Désinstaller ► Confirmation ──► Quitte
       └──► Quitter ────► Ferme l'app
```

### Barre de navigation (toujours en bas)

```bash
# Menu principal
[↑↓] Naviguer   [Entrée] Sélectionner   [Q] Quitter

# Sous-écran
[Retour] Menu   [Q] Quitter

# Logs (mode spécial)
[Retour] Menu   [F] Suivre   [C] Clear   [Q] Quitter

# Confirmation
[O] Oui   [N] Non   [Retour] Annuler
```

---

### Écran principal complet

Le logo moderne s'affiche en haut (voir "Bannière principale").

```
─────────────────────────────────────────

  ✅ Bot actif        📟 Claude actif

─────────────────────────────────────────

    ┌───────────────────────────────────┐
    │ ▶ Démarrer le bot                 │
    └───────────────────────────────────┘
       Mettre à jour
       Voir les logs
       Éditer la configuration
       Éditer les instructions Claude
       Nouveautés
       Gérer les skills
       Aide / FAQ
       Réinitialiser la configuration
       Désinstaller
       Quitter

─────────────────────────────────────────
 [↑↓] Naviguer  [Entrée] Sélectionner  [Q] Quitter
```

### États possibles

```bash
# Tout actif
  ✅ Bot actif        📟 Claude actif

# Bot actif, Claude inactif
  ✅ Bot actif        ⚫ Claude inactif

# Tout inactif
  ⚫ Bot inactif      ⚫ Claude inactif
```

---

## 4. Sous-écrans (Actions)

### Démarrage → Retour auto au menu

```
─────────────────────────────────────────

  ⠋ Démarrage du bot...

─────────────────────────────────────────
```

Puis (reste 2s puis retour auto) :

```
─────────────────────────────────────────

  ✔ Bot démarré (PID 12345)

  📱 Ouvre Telegram et envoie /start

─────────────────────────────────────────
 Retour au menu dans 2s...
```

### Arrêt → Retour auto au menu

```
─────────────────────────────────────────

  ⠋ Arrêt en cours...

─────────────────────────────────────────
```

Puis (reste 2s puis retour auto) :

```
─────────────────────────────────────────

  ✔ Bot arrêté
  ✔ Session Claude fermée

─────────────────────────────────────────
 Retour au menu dans 2s...
```

### Logs → Écran persistant avec retour manuel

```
─────────────────────────────────────────

  📜 Logs (les 20 derniers)

  18:30:01  Bot démarré
  18:30:05  ✔ User ID enregistré
  18:31:12  ← "Bonjour Claude"
  18:31:14  ⠋ Claude réfléchit...
  18:31:18  → Réponse envoyée
  18:32:45  ← "Merci !"
  18:32:46  → Réponse envoyée

─────────────────────────────────────────
 [R] Retour  [F] Suivre en temps réel  [C] Effacer
```

### Config / Instructions → Ouvre l'éditeur puis retour

```
─────────────────────────────────────────

  📝 Ouverture de l'éditeur...

  (Le menu reviendra après fermeture)

─────────────────────────────────────────
```

---

## 5. Mise à jour

### Vérification (spinner)

```
─────────────────────────────────────────

⠋ Vérification des mises à jour...

─────────────────────────────────────────
```

### Mise à jour disponible

```
─────────────────────────────────────────

  📦 Mise à jour disponible

    Installée:   v1.1.0
    Disponible:  v1.2.0

─────────────────────────────────────────

  Mettre à jour ?

     → Oui
       Non
       Retour au menu

─────────────────────────────────────────
 [↑↓] Naviguer  [Entrée] Sélectionner
```

### Déjà à jour → Retour auto

```
─────────────────────────────────────────

  ✔ Tu as la dernière version (v1.2.0)

─────────────────────────────────────────
 Retour au menu dans 2s...
```

### Progression (barre + checklist)

```
─────────────────────────────────────────

  📦 Mise à jour vers v1.2.0

    ✔ Arrêt du bot
    ✔ Téléchargement
    ⠋ Installation des dépendances...
    ○ Finalisation

    [████████████████░░░░░░░░░░] 60%

─────────────────────────────────────────
```

### Instructions Claude

```
─────────────────────────────────────────

  📝 Nouvelles instructions disponibles

     → Non (garder mes personnalisations)
       Oui (remplacer)

─────────────────────────────────────────
 [↑↓] Naviguer  [Entrée] Sélectionner
```

### Fin → Retour auto

```
╔═════════════════════════════════════════╗
║                                         ║
║     ✔ Mise à jour terminée (v1.2.0)     ║
║                                         ║
╚═════════════════════════════════════════╝

  ▶️  Redémarrer le bot ?

     → Oui
       Non

─────────────────────────────────────────
 [↑↓] Naviguer  [Entrée] Sélectionner
```

---

## 6. Désinstallation

### Écran de confirmation

```
─────────────────────────────────────────

  🗑️  Désinstallation

  ⚠️  Cette action va supprimer :

      • ~/.telebot/
      • Configuration et logs
      • Commande telebot

  Cette action est irréversible.

─────────────────────────────────────────

  Confirmer la suppression ?

    ┌───────────────────────────────────┐
    │ ▶ Annuler (retour au menu)        │
    └───────────────────────────────────┘
       Supprimer définitivement

─────────────────────────────────────────
 [↑↓] Naviguer  [Entrée] Sélectionner
```

### Progression (si confirmé)

```
─────────────────────────────────────────

  🗑️  Suppression en cours...

    ✔ Bot arrêté
    ✔ Session Claude fermée
    ⠋ Suppression des fichiers...
    ○ Nettoyage

─────────────────────────────────────────
```

### Fin → Quitte l'application

```
╔═════════════════════════════════════════╗
║                                         ║
║            👋 À bientôt !               ║
║                                         ║
║      Telebot a été désinstallé.         ║
║                                         ║
╚═════════════════════════════════════════╝

 (Le terminal se ferme dans 3s...)
```

---

## 7. Messages Telegram

### Premier contact

```
🔧 Configuration requise

Envoie le code à 8 chiffres affiché
dans ton terminal.
```

### Code correct

```
╔════════════════════════════╗
║  ✅ Configuration réussie  ║
╚════════════════════════════╝

Ton bot est maintenant actif !
Envoie un message à Claude.
```

### Code incorrect

```
❌ Code incorrect

Vérifie le code dans ton terminal.
```

### /start

```
🤖 Telebot actif

Envoie tes messages à Claude.

─────────────────────
/restart  Redémarrer
/yolo     Sans perms
/help     Aide
─────────────────────
```

Note : Le message Telegram est plus court et n'inclut pas le logo ASCII complet.

### /help

```
📖 Aide Telebot

/start    Démarrer
/restart  Redémarrer Claude
/yolo     Mode sans permissions ⚡
/stop     Arrêter Claude
/help     Cette aide

💡 Envoie un message pour
   parler à Claude.
```

### /restart

```
🔄 Session redémarrée

Envoie un message pour continuer.
```

### /yolo

```
⚡ Mode YOLO

Claude a toutes les permissions.
Aucune confirmation demandée.

⚠️ À utiliser avec précaution.
```

### /stop

```
🛑 Session arrêtée

/start pour relancer.
```

### Permission requise

```
🔐 Permission requise

Choisis une option :

  1 → Oui
  2 → Oui, toujours
  3 → Non
```

### Non autorisé

```
⛔ Accès refusé
```

---

## 8. Référence Technique

### Couleurs (tput)

```bash
# Définition
RED=$(tput setaf 1)
GREEN=$(tput setaf 2)
YELLOW=$(tput setaf 3)
BLUE=$(tput setaf 4)
CYAN=$(tput setaf 6)
BOLD=$(tput bold)
DIM=$(tput dim)
RESET=$(tput sgr0)

# Usage
echo "${GREEN}✔${RESET} Succès"
echo "${RED}✖${RESET} Erreur"
echo "${YELLOW}⚠${RESET} Attention"
echo "${BLUE}→${RESET} En cours"
echo "${BOLD}Titre${RESET}"
echo "${DIM}Secondaire${RESET}"
```

### Spinner fonction

```bash
spinner() {
    local pid=$1
    local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
    local i=0
    while kill -0 $pid 2>/dev/null; do
        printf "\r${frames[$i]} $2"
        i=$(( (i + 1) % ${#frames[@]} ))
        sleep 0.1
    done
    printf "\r✔ $2\n"
}

# Usage
long_task & spinner $! "Chargement..."
```

### Barre de progression

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

# Usage
for i in {1..100}; do
    progress_bar $i 100
    sleep 0.05
done
echo
```

### Typing effect

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

# Usage
type_text "Bienvenue dans Telebot !" 0.03
```

### Flash effect

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

# Usage
flash "✔ Succès !" "$GREEN"
```

### Boucle TUI principale

```bash
# Boucle principale - ne quitte jamais sauf demande explicite
main_loop() {
    local current_screen="menu"

    while true; do
        clear
        draw_header

        case $current_screen in
            menu)
                draw_status
                result=$(draw_menu)
                case $result in
                    0) do_start; pause 2 ;;
                    1) do_stop; pause 2 ;;
                    2) current_screen="logs" ;;
                    3) do_config; current_screen="menu" ;;
                    4) do_prompt; current_screen="menu" ;;
                    5) current_screen="update" ;;
                    6) current_screen="uninstall" ;;
                    7) break ;;  # Quitter
                esac
                ;;
            logs)
                draw_logs
                read -rsn1 key
                case $key in
                    r|R) current_screen="menu" ;;
                    f|F) follow_logs ;;
                    c|C) clear_logs ;;
                esac
                ;;
            update)
                if do_update; then
                    pause 2
                fi
                current_screen="menu"
                ;;
            uninstall)
                if confirm_uninstall; then
                    do_uninstall
                    break  # Quitte après désinstallation
                fi
                current_screen="menu"
                ;;
        esac
    done
}

# Pause avec compte à rebours
pause() {
    local seconds=$1
    for ((i=seconds; i>0; i--)); do
        printf "\r Retour au menu dans ${i}s..."
        sleep 1
    done
}

# Lancement
main_loop
```

### Navigation clavier

```bash
# Lecture des touches avec gestion des flèches
read_key() {
    local key
    IFS= read -rsn1 key

    # Séquence d'échappement (flèches)
    if [[ $key == $'\x1b' ]]; then
        read -rsn2 -t 0.1 key
        case $key in
            '[A') echo "UP" ;;
            '[B') echo "DOWN" ;;
            '[C') echo "RIGHT" ;;
            '[D') echo "LEFT" ;;
        esac
    elif [[ $key == "" ]]; then
        echo "ENTER"
    elif [[ $key == "q" || $key == "Q" ]]; then
        echo "QUIT"
    elif [[ $key == "r" || $key == "R" ]]; then
        echo "RETURN"
    else
        echo "$key"
    fi
}
```

---

## 9. Palette émojis

| Contexte | Émoji |
|----------|-------|
| Succès | ✔ ✅ |
| Erreur | ✖ ❌ |
| Warning | ⚠️ |
| Info | 💡 |
| En attente | ○ |
| Bot/Robot | 🤖 |
| Session | 📟 |
| Sécurité | 🔐 🔑 |
| Config | 🔧 |
| Package | 📦 |
| Logs | 📜 |
| Mise à jour | 📥 |
| Supprimer | 🗑️ |
| Téléphone | 📱 |
| YOLO | ⚡ |
| Bye | 👋 |
| Interdit | ⛔ |
