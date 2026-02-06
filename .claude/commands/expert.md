---
name: expert
description: Workflow expert en 6 phases pour les tâches complexes. Analyse, Explore, Plan, Execute, Verify, Deliver.
allowed-tools: Read, Edit, Write, Bash, Glob, Grep, Task, AskUserQuestion, TaskCreate, TaskUpdate, TaskList
---

# Expert

$ARGUMENTS

---

## Package manager

Détecter automatiquement :
- `pnpm-lock.yaml` présent → utiliser `pnpm`
- `package-lock.json` présent → utiliser `npm`
- Par défaut : `pnpm`

---

## Phase 1 : ANALYSE

Objectif : comprendre exactement ce que l'utilisateur veut avant de toucher au code.

1. Reformuler la demande en 1 phrase claire
2. Identifier les fichiers potentiellement concernés via Glob rapide
3. Lire les fichiers de config du projet (package.json, tsconfig.json, CLAUDE.md) pour comprendre le contexte technique
4. Lister les livrables attendus
5. Définir le scope : ce qui est inclus, ce qui ne l'est pas
6. Si ambiguïté critique : AskUserQuestion pour clarifier avant d'aller plus loin
7. Définir les critères de succès mesurables

**Gate :** Demande comprise + scope défini + ambiguïtés levées → Phase 2

## Phase 2 : EXPLORE

Objectif : acquérir le contexte complet du code pour planifier efficacement.

1. Glob pour cartographier les fichiers cibles et leur structure
2. Read chaque fichier qui sera modifié ou impacté
3. Read les fichiers adjacents (imports, dépendances directes)
4. Grep pour identifier les patterns existants, conventions de nommage, styles
5. Identifier les cas limites et les interactions entre modules
6. Repérer les points d'insertion exacts (fichier + zone)
7. Lancer des sous-agents Task(Explore) si le scope est large (> 5 fichiers)

**Gate :** Tous les fichiers lus + patterns identifiés + points d'insertion définis → Phase 3

## Phase 3 : PLAN

Objectif : structurer le travail avec tout le contexte acquis en phase 2.

1. Lister les tâches numérotées avec les fichiers concernés par tâche
2. Définir l'ordre d'exécution et les dépendances entre tâches
3. Identifier les risques de régression pour chaque modification
4. TaskCreate pour chaque tâche si > 3 tâches
5. Définir les checkpoints de vérification intermédiaires

**Gate :** Toutes les tâches identifiées + ordre défini → Phase 4

## Phase 4 : EXECUTE

Objectif : implémenter chaque tâche méthodiquement.

Pour chaque tâche du plan :
1. TaskUpdate → in_progress
2. Edit ou Write le fichier
3. Vérifier l'absence d'erreur de syntaxe immédiate
4. Si TypeScript : build incrémental pour valider les types
5. TaskUpdate → completed

Build command : `pnpm run build` (ou `npm run build` si package-lock.json détecté)

**Gate :** Toutes les tâches complétées sans erreur → Phase 5

## Phase 5 : VERIFY

Objectif : garantir zéro régression.

1. Build complet du projet
2. Relire chaque fichier modifié pour vérifier la cohérence
3. Vérifier les imports, types et références entre fichiers
4. Contrôler les cas limites identifiés en phase 2
5. Si des tests existent : les lancer
6. Corriger immédiatement tout problème détecté puis re-vérifier

**Gate :** Build OK + aucune régression → Phase 6

## Phase 6 : DELIVER

Objectif : présenter le travail accompli.

1. `git diff` pour review final de toutes les modifications
2. Valider un par un les critères de succès définis en phase 1
3. Résumé concis :
   - Fichiers modifiés/créés/supprimés
   - Actions réalisées
   - Points d'attention éventuels

---

**Règles :** Ne jamais sauter de phase. Vérifier après chaque Edit. AskUserQuestion en cas d'ambiguïté critique.
