# Messages Telegram

Maquettes des messages envoyés par le bot sur Telegram.

## Configuration initiale

### Code requis

```
🔧 *Configuration requise*

Envoyez le code à 8 chiffres affiché dans votre terminal.
```

### Code correct

```
✅ *Configuration réussie !*

Votre bot est maintenant actif.
Envoyez vos messages à Claude !
```

### Code incorrect

```
🔧 *Configuration requise*

Envoyez le code à 8 chiffres affiché dans votre terminal.
```

## Commandes

### /start

```
🤖 *Telebot actif*

Envoie tes messages à Claude.

/restart - Redémarrer
/yolo - Mode sans permissions
/help - Aide
```

### /help

```
🤖 *Telebot - Aide*

`/start` - Démarrer le bot
`/restart` - Redémarrer Claude
`/yolo` - Mode sans permissions ⚡
`/stop` - Arrêter Claude
`/help` - Cette aide

💡 Envoie un message pour parler à Claude.
```

### /restart

```
🔄 Session terminée. Envoie un message pour redémarrer.
```

### /yolo

```
⚡ *Mode YOLO activé*

Claude fonctionne sans demander de permissions.

⚠️ Toutes les commandes seront exécutées automatiquement.
```

### /stop

```
🛑 Session Claude arrêtée.
```

## Permissions

### Demande de permission

```
🔐 *Permission requise*

Réponds:
`1` = Oui
`2` = Oui, toujours
`3` = Non
```

## Erreurs

### Non autorisé

```
❌ Non autorisé.
```

### Bot non sécurisé

```
⚠️ *Bot non sécurisé*

Configure `TELEGRAM_USER_ID` dans
`~/.telebot/config.env`
```

### Erreur de sauvegarde

```
❌ *Erreur de sauvegarde*

Vérifiez les logs du bot (`telebot logs`).
```

## Notes de formatage

- Utiliser `parse_mode: 'Markdown'` pour tous les messages
- **Gras** avec `*texte*`
- `Code` avec backticks
- Garder les messages courts pour mobile
- Utiliser des emojis pour la lisibilité
