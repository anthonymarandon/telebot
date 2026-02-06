# Installation

Maquettes pour `install.sh`.

## 1. Bannière d'accueil

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
─────────────────────────────────────────
```

- Séparateurs (══) : `cyan`
- Texte TELEBOT : `cyan`
- Slogan et version : `dim`

## 2. Vérification des prérequis

### Tous présents

```
  📋 Prérequis

  ✔ Node.js        v20.10.0
  ✔ npm            v10.2.3
  ✔ tmux           3.4
  ✔ Claude Code    v2.1.29 (optionnel)

```

### Manquant

```
  📋 Prérequis

  ✔ Node.js        v20.10.0
  ✔ npm            v10.2.3
  ✖ tmux           non trouvé
  ✔ Claude Code    (optionnel)

─────────────────────────────────────────

  💡 Installation requise :

     macOS:  brew install node tmux
     Linux:  sudo apt install nodejs npm tmux

```

## 3. Téléchargement et installation

### Progression dynamique

La zone d'installation utilise un affichage dynamique :
- Une seule barre de progression qui se met à jour
- Les étapes s'effacent une fois terminées
- L'écran reste épuré

**État initial :**
```
  📦 Installation

  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 1/4 Téléchargement
  ⠋ Téléchargement des fichiers...
```

**Pendant l'installation :**
```
  📦 Installation

  [████████████████░░░░░░░░░░░░░░] 2/4 Dépendances
  ✔ Téléchargement des fichiers
  ⠋ Installation des dépendances...
```

**Étape suivante :**
```
  📦 Installation

  [████████████████████████░░░░░░] 3/4 Configuration
  ✔ Installation des dépendances
```

**Fin :**
```
  📦 Installation

  [██████████████████████████████] 4/4 Finalisation
  ✔ Installation de la commande telebot
```

## 4. Configuration du token

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

### Token existant

```
  Un token existe déjà. Que faire?

   → Garder l'ancien token
     Entrer un nouveau token
```

### Token enregistré

```
  ✔ Token enregistré
```

## 5. Finalisation

```
  ⚙️  Finalisation

  ⠋ Installation de la commande telebot...
```

Puis :

```
  ⚙️  Finalisation

  ✔ Installation de la commande telebot
  ✔ PATH mis à jour (~/.zshrc)
```

## 6. Succès

```
╔═════════════════════════════════════════╗
║                                         ║
║     ✔ Installation terminée !           ║
║                                         ║
╚═════════════════════════════════════════╝
```

- Encadré : `cyan brillant`
- ✔ : `vert`

### Menu de démarrage

```
  ▶️  Démarrer le bot maintenant?

    ┌───────────────────────────────────┐
    │ ▶ Oui                             │
    └───────────────────────────────────┘
       Non
```

- Encadré sélection : `cyan`
- Flèche ▶ : `cyan`
- Option sélectionnée : `bold`
- Option non sélectionnée : `dim`

## 7. Code d'activation

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

- Encadré : `cyan brillant`
- Titre : `bold`
- Chiffres : `bold` (blanc, lisibilité maximale)
- Message : `dim`
- Instruction finale : `dim`

Après appui sur Entrée → lance le CLI interactif `telebot`

## 8. Installation reportée

```
  Tu peux démarrer plus tard avec:
    telebot start

  Code d'activation: 12345678
  (à envoyer sur Telegram après le démarrage)
```

## Échec et nettoyage

```
  ✖ Échec de l'installation

  🧹 Nettoyage...
     Dossier ~/.telebot supprimé
```
