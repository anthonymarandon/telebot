# Telebot

<p align="center">
  <img src="teasing.png" alt="Telebot - Contrôle Claude Code depuis Telegram" width="600">
</p>

<p align="center">
  <b>Contrôle Claude Code depuis ton téléphone via Telegram.</b>
</p>

```bash
curl -fsSL https://raw.githubusercontent.com/anthonymarandon/telebot/main/install.sh | bash
```

---

## Prérequis

Avant d'installer Telebot, tu as besoin de :

- **Node.js** 18+
- **tmux** 3+
- **Claude Code**

> **Windows** : Telebot n'est pas compatible nativement. Utilise WSL (Windows Subsystem for Linux) pour émuler un environnement Linux.

Voir le [guide d'installation des prérequis](./PREREQUISITES.md) pour ton système.

---

## Créer ton bot Telegram

1. Ouvre **Telegram** et cherche **@BotFather** (coche bleue)
2. Envoie `/newbot`
3. Choisis un **nom** (ex: "Mon Assistant Claude")
4. Choisis un **username** finissant par `bot` (ex: `mon_claude_bot`)
5. **Copie le token** que BotFather t'envoie — tu en auras besoin à l'installation

---

## Utilisation

Après l'installation, lance le CLI interactif :

`telebot`

Tout se fait depuis le menu : démarrer le bot, voir les logs, configurer, mettre à jour.

Sur Telegram, envoie simplement tes messages à ton bot. Claude répond directement dans la conversation.

---

## Documentation

| Sujet | Lien |
|-------|------|
| Prérequis et installation | [PREREQUISITES.md](./PREREQUISITES.md) |
| Notes de version | [CHANGELOG.md](./CHANGELOG.md) |

---

<p align="center">
  <b>Une question ?</b> Ouvre une <a href="https://github.com/anthonymarandon/telebot/issues">issue sur GitHub</a>
</p>
