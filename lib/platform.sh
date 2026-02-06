#!/usr/bin/env bash
# Telebot - Utilitaires cross-platform
# Sourcé par telebot et install.sh

# Bash 3.2 (macOS) doesn't accept fractional seconds for `read -t`.
if (( BASH_VERSINFO[0] >= 4 )); then
    READ_TIMEOUT="0.1"
else
    READ_TIMEOUT="1"
fi

detect_os() {
    case "$(uname -s)" in
        Darwin*) echo "macos" ;;
        Linux*)  echo "linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *)       echo "unknown" ;;
    esac
}
OS_TYPE=$(detect_os)

get_temp_dir() {
    if [ -n "$TMPDIR" ]; then
        echo "$TMPDIR"
    elif [ -n "$TEMP" ]; then
        echo "$TEMP"
    elif [ -n "$TMP" ]; then
        echo "$TMP"
    else
        echo "/tmp"
    fi
}
TEMP_DIR=$(get_temp_dir)

# Compatible Bash 3.2+
repeat_char() {
    local char="$1" count="$2" result=""
    local i=0
    while [ $i -lt $count ]; do
        result="${result}${char}"
        i=$((i + 1))
    done
    printf "%s" "$result"
}

copy_to_clipboard() {
    local text="$1"
    case "$OS_TYPE" in
        macos)
            echo "$text" | pbcopy && return 0
            ;;
        linux)
            if command -v xclip >/dev/null 2>&1; then
                echo "$text" | xclip -selection clipboard && return 0
            elif command -v xsel >/dev/null 2>&1; then
                echo "$text" | xsel --clipboard && return 0
            fi
            ;;
        windows)
            echo "$text" | clip.exe && return 0
            ;;
    esac
    return 1
}

open_path() {
    local path="$1"
    case "$OS_TYPE" in
        macos)   open "$path" 2>/dev/null ;;
        linux)   xdg-open "$path" 2>/dev/null ;;
        windows) start "" "$path" 2>/dev/null ;;
    esac
}

read_key() {
    if [ "$OS_TYPE" = "windows" ]; then
        read "$@"
    else
        read "$@" < /dev/tty
    fi
}

get_file_mtime() {
    local file="$1"
    case "$OS_TYPE" in
        macos)   stat -f %m "$file" 2>/dev/null ;;
        linux)   stat -c %Y "$file" 2>/dev/null ;;
        windows) stat -c %Y "$file" 2>/dev/null ;;
    esac
}

get_bin_dir() {
    case "$OS_TYPE" in
        macos|linux) echo "$HOME/.local/bin" ;;
        windows)     echo "$HOME/bin" ;;
    esac
}

get_shell_rc() {
    case "$OS_TYPE" in
        windows) echo "$HOME/.bashrc" ;;
        *)
            if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
                echo "$HOME/.zshrc"
            else
                echo "$HOME/.bashrc"
            fi
            ;;
    esac
}
