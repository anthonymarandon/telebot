# Conventions Shell (Bash)

Guide des bonnes pratiques pour les scripts Bash du projet.

## Outil de vérification

```bash
shellcheck <fichier.sh>
```

Installer si absent : `brew install shellcheck`

## Règles principales

### 1. Variables - Toujours quoter

```bash
# Mauvais
echo $variable
[ $i -eq 0 ]

# Bon
echo "$variable"
[ "$i" -eq 0 ]
```

### 2. local - Uniquement dans les fonctions

```bash
# Mauvais (erreur: local hors fonction)
local response
response=$(curl ...)

# Bon (dans une fonction)
my_function() {
    local response
    response=$(curl ...)
}

# Bon (hors fonction, pas de local)
response=$(curl ...)
```

### 3. Déclaration et assignation séparées

```bash
# Mauvais (masque le code retour)
local result=$(command)

# Bon
local result
result=$(command)
```

### 4. printf - Pas de variables dans le format

```bash
# Mauvais
printf "${COLOR}Message: $msg${RESET}\n"

# Bon
printf "%sMessage: %s%s\n" "${COLOR}" "$msg" "${RESET}"
```

### 5. cd - Toujours gérer l'échec

```bash
# Mauvais
cd "$dir"

# Bon
cd "$dir" || return 1
cd "$dir" || exit 1
```

### 6. read - Utiliser -r

```bash
# Mauvais (mangle les backslashes)
while read line; do

# Bon
while read -r line; do
```

### 7. Tester le code retour directement

```bash
# Mauvais
command
if [ $? -eq 0 ]; then

# Bon
if command; then
```

### 8. Redirection sans commande

```bash
# Mauvais
> "$file"

# Bon
true > "$file"
```

### 9. Conditions composées

```bash
# Mauvais (non portable)
[ -z "$a" -a -n "$b" ]

# Bon
[ -z "$a" ] && [ -n "$b" ]
# ou
{ [ -z "$a" ] && [ -n "$b" ]; }
```

## Compatibilité Bash 3.2 (macOS)

```bash
# read -t avec décimales : non supporté en Bash 3.2
if (( BASH_VERSINFO[0] >= 4 )); then
    READ_TIMEOUT="0.1"
else
    READ_TIMEOUT="1"
fi
```

## Faux positifs acceptés

| Code | Raison |
|------|--------|
| SC1091 | Fichier source généré dynamiquement |
| SC2016 | Single quotes intentionnelles (écriture dans .bashrc) |

## Workflow

1. Modifier le script
2. Lancer `shellcheck <script>`
3. Corriger tous les warnings
4. Commit quand 0 erreurs
