#!/bin/sh
# Fabrique les fichiers d'essai et test.js, assemble, vérifie la syntaxe, lance le banc.
cd "$(dirname "$0")/.." || exit 1
node idee-6-integration/generer.js && python3 outillage/assembler.py idee-6-integration/essai.html idee-6-integration && node --check idee-6-integration/essai.js && node outillage/banc.js idee-6-integration/essai.js idee-6-integration/test.js
