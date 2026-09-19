#!/usr/bin/env bash
# Script d'autorisation de mise à jour de l'extension Outiiil pour macOS et Linux

if [ "$EUID" -ne 0 ]; then
  echo "Ce script nécessite les privilèges administrateur (sudo)."
  exec sudo bash "$0" "$@"
fi

OS="$(uname -s)"
case "${OS}" in
    Linux*)
        echo "Configuration des politiques Chrome sous Linux..."
        mkdir -p /etc/opt/chrome/policies/managed
        cat << 'EOF' > /etc/opt/chrome/policies/managed/outiiil_policy.json
{
  "ExtensionInstallSources": ["https://arpegorpsgh.github.io/*"]
}
EOF
        chmod 644 /etc/opt/chrome/policies/managed/outiiil_policy.json
        echo "Politiques Linux appliquées avec succès !"
        ;;
    Darwin*)
        echo "Configuration des politiques Chrome sous macOS..."
        defaults write com.google.Chrome ExtensionInstallSources -array "https://arpegorpsgh.github.io/*"
        echo "Politiques macOS appliquées avec succès !"
        ;;
    *)
        echo "Système d'exploitation non supporté: ${OS}"
        exit 1
        ;;
esac
