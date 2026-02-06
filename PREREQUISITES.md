# Prérequis Telebot

Ce guide détaille l'installation des prérequis sur chaque système d'exploitation.

---

## Configuration minimale

| Composant | Version minimale | Rôle |
|-----------|------------------|------|
| **Node.js** | 18.0.0+ | Exécute le bot Telegram |
| **npm** | 8.0.0+ | Gère les dépendances |
| **tmux** | 3.0+ | Maintient Claude actif en arrière-plan |
| **Claude Code** | Dernière version | Assistant IA en ligne de commande |

---

## Installation par système

### macOS

**Prérequis** : [Homebrew](https://brew.sh/) (gestionnaire de paquets)

```bash
# Installer Homebrew (si absent)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer les dépendances
brew install node tmux

# Vérifier
node --version  # v18+
tmux -V         # tmux 3.x
```

**Apple Silicon (M1/M2/M3/M4)** : Toutes les dépendances sont compatibles nativement.

---

### Linux (Debian / Ubuntu)

```bash
# Mettre à jour les paquets
sudo apt update

# Installer Node.js 18+ via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installer tmux
sudo apt install -y tmux

# Vérifier
node --version  # v18+
npm --version   # v8+
tmux -V         # tmux 3.x
```

---

### Linux (Fedora / RHEL / CentOS)

```bash
# Installer Node.js
sudo dnf install -y nodejs npm

# Installer tmux
sudo dnf install -y tmux

# Vérifier
node --version
tmux -V
```

---

### Linux (Arch Linux / Manjaro)

```bash
# Installer les dépendances
sudo pacman -S nodejs npm tmux

# Vérifier
node --version
tmux -V
```

---

### Windows (via WSL)

Telebot nécessite un environnement Unix. Sur Windows, utilisez **WSL** (Windows Subsystem for Linux).

#### Étape 1 : Installer WSL2

Ouvrez PowerShell **en administrateur** et exécutez :

```powershell
wsl --install
```

Redémarrez votre ordinateur après l'installation.

#### Étape 2 : Configurer Ubuntu

Au premier lancement de WSL, créez un utilisateur Unix :

```
Enter new UNIX username: votre_nom
New password: ********
```

#### Étape 3 : Installer les prérequis dans WSL

```bash
# Mettre à jour
sudo apt update && sudo apt upgrade -y

# Installer Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installer tmux
sudo apt install -y tmux

# Vérifier
node --version
tmux -V
```

#### Accès aux fichiers Windows

Vos fichiers Windows sont accessibles depuis WSL :
- `C:\Users\Vous` → `/mnt/c/Users/Vous`

---

## Installation de Claude Code

Claude Code est l'assistant IA qui répond à vos questions.

### Option 1 : Via npm (recommandé)

```bash
npm install -g @anthropic-ai/claude-code
```

### Option 2 : Via le site officiel

Téléchargez depuis [claude.ai/download](https://claude.ai/download)

### Configuration

Après installation, connectez-vous à votre compte :

```bash
claude login
```

Suivez les instructions pour authentifier Claude avec votre compte Anthropic.

---

## Vérification complète

Exécutez ces commandes pour confirmer que tout est prêt :

```bash
# Node.js (doit afficher v18.x.x ou plus)
node --version

# npm (doit afficher v8.x.x ou plus)
npm --version

# tmux (doit afficher tmux 3.x)
tmux -V

# Claude Code (doit afficher la version)
claude --version
```

**Résultat attendu :**

```
v20.10.0
10.2.4
tmux 3.4
Claude Code vX.X.X
```

Si toutes les commandes fonctionnent, vous pouvez installer Telebot :

```bash
curl -fsSL https://raw.githubusercontent.com/anthonymarandon/telebot/main/install.sh | bash
```

---

## Dépannage

### Node.js : "command not found"

**macOS** : Assurez-vous que Homebrew est dans votre PATH :
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

**Linux** : Utilisez NodeSource au lieu du paquet système (souvent obsolète) :
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### tmux : "command not found"

**macOS** :
```bash
brew install tmux
```

**Linux** :
```bash
sudo apt install tmux  # Debian/Ubuntu
sudo dnf install tmux  # Fedora
```

### Claude : "command not found"

Vérifiez que npm global est dans votre PATH :

```bash
# Voir où npm installe les paquets globaux
npm config get prefix

# Ajouter au PATH (exemple pour /usr/local)
export PATH="$PATH:$(npm config get prefix)/bin"
```

Ajoutez cette ligne à votre `~/.bashrc` ou `~/.zshrc` pour la rendre permanente.

### WSL : Erreur de permissions

Si vous rencontrez des erreurs de permissions dans WSL :

```bash
# Réinstaller Node.js proprement
sudo apt remove nodejs
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Claude : "Not logged in"

Authentifiez-vous :

```bash
claude login
```

Suivez le lien qui s'affiche pour vous connecter avec votre compte Anthropic.

---

## Ressources

- [Node.js](https://nodejs.org/) - Documentation officielle
- [tmux](https://github.com/tmux/tmux/wiki) - Wiki officiel
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) - Documentation Anthropic
- [WSL](https://learn.microsoft.com/fr-fr/windows/wsl/) - Guide Microsoft

---

<p align="center">
  <a href="https://github.com/anthonymarandon/telebot">← Retour au README</a>
</p>
