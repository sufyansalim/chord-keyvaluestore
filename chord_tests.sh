  
#!/bin/bash -l

if [ $# -lt 1 ]
  then
    echo "Usage: getNeighbors|getstorageItem|putstorageItem || grow|shrink|tolerance|stability"
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
#echo "TES_ADDRESS: ${TEST_ADDRESS[*]}"

len=$((${#TEST_ADDRESS[*]}-1))
echo "len: $len"
#length = len
# length= $(${TEST_ADDRESS[-1]})
# echo "lenth: $length"

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
elif [ "$1" = "grow" ]; then
  start=$(date +%s%N)
  for l in "${!TEST_ADDRESS[@]}"; do
    if [ ${l} -ne 0 ] && [ ${l} -ne $((${#TEST_ADDRESS[@]}-1)) ]; then
    #if [ ${l} -lt $((${#TEST_ADDRESS[@]}-1)) ]; then
        ssh -f ${TMP_HOSTNAME[l]} 'curl -X POST '"'http://localhost:${TMP_PORT[l]}/join?nprime=${TMP_HOSTNAME[$((${#TEST_ADDRESS[@]}-1))]}:${TMP_PORT[$((${#TEST_ADDRESS[@]}-1))]}'"''
    elif [ ${l} == 0 ]; then
        ssh -f ${TMP_HOSTNAME[0]} 'curl -X POST '"'http://localhost:${TMP_PORT[0]}/join?nprime=${TMP_HOSTNAME[0]}:${TMP_PORT[0]}'"''
    elif [ ${l} -eq $((${#TEST_ADDRESS[@]}-1)) ]; then
      ssh -f ${TMP_HOSTNAME[l]} 'curl -X POST '"'http://localhost:${TMP_PORT[l]}/join?nprime=${TMP_HOSTNAME[0]}:${TMP_PORT[0]}&id=${l}'"''
    fi  
  done
elif [ "$1" = "shrink" ]; then
  start=$(date +%s%N)
  for l in "${!TEST_ADDRESS[@]}"; do
     if [ ${l} -ge $((${#TEST_ADDRESS[@]}/2)) ]; then
      # echo "length: $((${#TEST_ADDRESS[@]}/2)) "
      # echo "index: ${l} "
      ssh -f ${TMP_HOSTNAME[l]} 'curl -X POST '"'http://localhost:${TMP_PORT[l]}/leave/'"''  
    fi
  done
  elif [ "$1" = "tolerance" ]; then
  start=$(date +%s%N)
  for l in "${!TEST_ADDRESS[@]}"; do
     if [ ${l} -ge $((${#TEST_ADDRESS[@]}/2)) ]; then
      ssh -f ${TMP_HOSTNAME[l]} 'curl -X POST '"'http://localhost:${TMP_PORT[l]}/sim-crash/'"''  
    fi
  done
    elif [ "$1" = "stability" ]; then
  start=$(date +%s%N)
  for l in "${!TEST_ADDRESS[@]}"; do
      # ssh -f ${TMP_HOSTNAME[l]} 'export ADDRESS='"'${TMP_HOSTNAME[l]}:${TMP_PORT[l]}'"' INDEX='"'${l}'"';node '"'$(pwd)'"'/test4.js'
      ssh -f ${TMP_HOSTNAME[0]} 'curl -X GET '"'http://localhost:${TMP_PORT[0]}/stability/?myaddress=${${TMP_HOSTNAME[0]}:${TMP_PORT[0]}}&nodeaddress=${${TMP_HOSTNAME[1]}:${TMP_PORT[1]}}&id=${len}'"''  
  done
fi
  end=$((($(date +%s%N) - $start)/1000000))

echo "............................."
echo "Total time: ${end} ms"
echo "............................."