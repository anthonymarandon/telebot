---
name: commit
description: Commit avec changelog et version. Ajouter "release" pour tag+push. Toujours compiler avant si src/ modifie.
---

# /commit

## Variantes

- `/commit` → commit local uniquement
- `/commit release` → commit + tag + push

## Outils

| Action | Outil |
|--------|-------|
| Compiler | Bash: `npm run build` |
| Analyser | Bash: `git status`, `git diff` |
| Modifier | Edit: CHANGELOG.md, package.json |
| Commit | Bash: `git add`, `git commit` |
| Release | Bash: `git tag`, `git push` |

## Exécution

### 1. Compiler (si src/ modifié)

```bash
npm run build
```
Stop si erreur.

### 2. Analyser

```bash
git status
git diff --stat
```

Identifier :
- Fichiers à inclure
- Type de changement (feat/fix/docs/chore)

**Exclure** : `.DS_Store`, `node_modules/`, fichiers perso

### 3. Changelog + Version

**Demander accord utilisateur** avant modification.

CHANGELOG.md :
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Ajouté/Modifié/Corrigé
- {description}
```

package.json :
- PATCH : bugfix, mineur
- MINOR : nouvelle feature

### 4. Commit

```bash
git add {fichiers spécifiques}
git commit -m "$(cat <<'EOF'
{type}: {description}

{détails si nécessaire}

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Types : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `chore`

### 5. Vérifier

```bash
git log -1 --oneline
git status
```

### 6. Release (si demandé)

```bash
git tag -a v{VERSION} -m "Release v{VERSION}"
git push origin main
git push origin v{VERSION}
```

## Output

```
✅ Commit : {hash}
📦 Version : {X.Y.Z}
📝 Fichiers : {nombre}
{si release: 🏷️ Tag : v{X.Y.Z}}
{si release: 🔗 Pushed to origin}
```

## Règles

- Un commit = une unité logique
- Première ligne < 72 chars
- Toujours build avant si TypeScript
- Jamais `git add .` → fichiers spécifiques
- Demander avant de modifier version
