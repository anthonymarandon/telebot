# Skill: Add Menu Option

Ajoute une nouvelle option au menu interactif du CLI telebot.

## Déclencheur
`/add-menu` ou "ajoute une option au menu"

## Paramètres
- `label` : Texte affiché dans le menu
- `action` : Identifiant de l'action (snake_case)

## Architecture actuelle

Le menu utilise un système dynamique avec deux tableaux :
- `MENU_OPTIONS` : Labels affichés
- `MENU_ACTIONS` : Identifiants d'action

## Actions

### 1. Ajouter dans `build_menu()`

```bash
build_menu() {
    MENU_OPTIONS=()
    MENU_ACTIONS=()

    # ... options existantes ...

    # Nouvelle option (avant Quitter)
    MENU_OPTIONS+=("{label}")
    MENU_ACTIONS+=("{action}")

    # Quitter doit rester en dernier
    MENU_OPTIONS+=("Quitter")
    MENU_ACTIONS+=("quit")
}
```

### 2. Créer la fonction handler

```bash
do_{action}_interactive() {
    echo ""
    # Action ici
    success "Action effectuée"
    echo ""
    pause_return 2
}
```

### 3. Ajouter le case dans `interactive_menu()`

```bash
case "$SELECTED_ACTION" in
    # ... autres actions ...
    {action}) do_{action}_interactive ;;
    quit)
        clear
        logo
        echo "  ${C_DIM}👋 À bientôt !${C_RESET}"
        echo ""
        exit 0
        ;;
esac
```

### 4. Option conditionnelle (optionnel)

Pour afficher une option selon une condition :

```bash
build_menu() {
    # ...

    # Option affichée seulement si condition vraie
    if some_condition; then
        MENU_OPTIONS+=("{label}")
        MENU_ACTIONS+=("{action}")
    fi

    # ...
}
```

Exemple existant : "Stopper sessions tmux" n'apparaît que si `has_tmux_sessions` retourne vrai.

## Structure actuelle du menu

| Label | Action | Condition |
|-------|--------|-----------|
| Démarrer le bot | `start` | si bot inactif |
| Arrêter le bot | `stop` | si bot actif |
| Stopper sessions tmux | `kill_tmux` | si sessions tmux |
| Voir les logs | `logs` | toujours |
| Éditer la configuration | `config` | toujours |
| Éditer les instructions Claude | `prompt` | toujours |
| Nouveautés | `changelog` | toujours |
| Mettre à jour | `update` | toujours |
| Réinitialiser la configuration | `reset_config` | toujours |
| Désinstaller | `uninstall` | toujours |
| Quitter | `quit` | toujours |

## Exemples d'options possibles

- **Voir la session Claude** : `tmux attach -t claude -r`
- **Exporter les logs** : Copier vers fichier daté
- **Statistiques** : Uptime, messages, etc.

## Notes

- L'option "Quitter" doit toujours être en dernier
- Utiliser `pause_return N` pour revenir au menu après N secondes
- Les options qui ouvrent un éditeur n'ont pas besoin de `pause_return`
- Les noms d'action doivent être en snake_case
