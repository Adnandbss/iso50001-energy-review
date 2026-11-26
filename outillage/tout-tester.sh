#!/bin/bash
# Assemble tous les modules dans l'ordre de référence et lance toutes les séries de tests. Usage : outillage/tout-tester.sh [dossier revue]
cd "${1:-$(dirname "$0")/..}" || exit 2
MODULES=$(for m in $(cat outillage/ordre-modules.txt); do [ -f "$m/module.js" ] && echo "$m"; done)   # les modules absents de cette branche sont ignorés
python3 outillage/assembler.py assemble.html $MODULES > /dev/null || { echo "ÉCHEC DE L'ASSEMBLAGE"; exit 1; }
node --check assemble.js || { echo "ÉCHEC DE SYNTAXE"; exit 1; }
echc=0
for t in outillage/test-base.js outillage/test-coupure.js $(for m in $MODULES; do [ -f "$m/test.js" ] && echo "$m/test.js"; done); do
  r=$(node outillage/banc.js assemble.js "$t" 2>&1 | tail -1); echo "$t : $r"
  echo "$r" | grep -q " 0 échec(s) ; appels réseau tentés : 0" || echc=1
done
exit $echc
