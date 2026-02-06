# Skill: Add Command

Ajoute une nouvelle commande Telegram au bot.

## Déclencheur
`/add-command` ou "ajoute une commande Telegram"

## Paramètres
- `name` : Nom de la commande (sans le /)
- `description` : Description courte pour le menu Telegram
- `action` : Ce que la commande doit faire

## Actions

### 1. Ajouter le handler dans `src/commands.ts`

```typescript
/**
 * /{name} - {description}
 */
export function handle{Name}(msg: TelegramBot.Message, ctx: BotContext): void {
  const { bot, state } = ctx;

  if (!isAuthorized(msg.from!.id, state.userId)) return;

  // Action ici
  bot.sendMessage(msg.chat.id, 'Message de réponse', { parse_mode: 'Markdown' });
}
```

### 2. Enregistrer la commande dans `src/index.ts`

Ajouter l'import :
```typescript
import {
  handleStart,
  handleRestart,
  // ... autres handlers
  handle{Name},  // Nouveau
} from './commands';
```

Ajouter au tableau des commandes :
```typescript
const commands = [
  // ... commandes existantes
  { command: '{name}', description: '{description}' },
];
```

Ajouter le handler :
```typescript
bot.onText(/\/{name}/, msg => handle{Name}(msg, ctx));
```

### 3. Mettre à jour l'aide dans `handleHelp`

Dans `src/commands.ts`, ajouter la ligne dans le message `/help` :
```typescript
'`/{name}` - {description}\n' +
```

### 4. Compiler et tester

```bash
npm run build
/deploy
```

## Exemples de commandes possibles

| Commande | Description | Action |
|----------|-------------|--------|
| `/ping` | Test de connexion | Répond "pong" |
| `/cwd` | Afficher le répertoire | Exécute `pwd` dans tmux |
| `/cancel` | Annuler l'action en cours | Envoie Ctrl+C à tmux |
| `/clear` | Effacer la session | Redémarre tmux proprement |

## Notes
- Toujours vérifier `isAuthorized(msg.from!.id, state.userId)` en premier
- Utiliser `{ parse_mode: 'Markdown' }` pour le formatage
- Les commandes doivent être courtes et intuitives
- Ne pas oublier de recompiler avec `npm run build`
