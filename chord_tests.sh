  
#!/bin/bash -l

if [ $# -lt 1 ]
  then
    echo "Usage: getNeighbors|getstorageItem|putstorageItem"
    exit
fi

LINE=1
  while read -r NODE
    do
      TMP_ADDRESS=(${NODE//:/ })
      TMP_HOSTNAME[LINE-1]=${TMP_ADDRESS[0]}
      TMP_PORT[LINE-1]=${TMP_ADDRESS[1]}
      TEST_ADDRESS[LINE-1]=$NODE
      ((LINE++))
  done < "./tmpaddress"
echo "TES_ADDRESS: ${TEST_ADDRESS[*]}"



# You need to create these files (RoadMapStatic & RoadMapDynamic) first - Makefile!
if [ "$1" = "getNeighbors" ]; then
 for l in "${!TEST_ADDRESS[@]}"; do
    echo "TMP_HOSTNAME: ${TMP_HOSTNAME[l]}"
    echo "TMP_PORT: ${TMP_PORT[l]}"
    ssh -f ${TMP_HOSTNAME[l]} 'export PORT='"'${TMP_PORT[l]}'"';node '"'$(pwd)'"'/test1.js'
  done
elif [ "$1" = "getstorageItem" ]; then
  for l in "${!TEST_ADDRESS[@]}"; do
    echo "TMP_HOSTNAME: ${TMP_HOSTNAME[l]}"
    echo "TMP_PORT: ${TMP_PORT[l]}"
    ssh -f ${TMP_HOSTNAME[l]} 'export PORT='"'${TMP_PORT[l]}'"';node '"'$(pwd)'"'/test2.js'
  done
elif [ "$1" = "putstorageItem" ]; then
  for l in "${!TEST_ADDRESS[@]}"; do
    echo "TMP_HOSTNAME: ${TMP_HOSTNAME[l]}"
    echo "TMP_PORT: ${TMP_PORT[l]}"
    ssh -f ${TMP_HOSTNAME[l]} 'export PORT='"'${TMP_PORT[l]}'"';node '"'$(pwd)'"'/test3.js'
  done
fi