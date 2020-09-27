#!/usr/bin/bash

if [ $# -lt 2 ]
  then
    echo "Usage: chord|demo num_hosts"
    exit
fi

sh generate_hosts.sh $2

if [ "$1" = "chord" ]; then
  ssh -f compute-8-2 "node /home/ssa169/Distrubuted-System/chord/server.js"
elif [ "$1" = "demo" ]; then
  LINE=1
  while read -r NODE
    do

      HOSTS[LINE-1]=$NODE
      PORTS[LINE-1]=$(( ( RANDOM % (65535-49152) ) + 49152 ))
      ADDRESSES[LINE-1]="${NODE}:${PORTS[LINE-1]}"

      ((LINE++))
  done < "./hostfile"

  IDENTIFIER_IDS_STRING=$(ADDRESSES=${ADDRESSES[*]} node initialize_nodes.js)
  # echo "IDENTIFIER_IDS_STRING : $IDENTIFIER_IDS_STRING"

  IDENTIFIER_IDS=(${IDENTIFIER_IDS_STRING// / })

  IFS=$'\n' SORTED_IDENTIFIER_IDS=($(sort <<<"${IDENTIFIER_IDS[*]}")); unset IFS

  # for k in "${!SORTED_IDENTIFIER_IDS[@]}"; do
  #   echo "SORTED_IDENTIFIER_IDS[k] : ${SORTED_IDENTIFIER_IDS[k]}"
  # done

  # echo "SORTED_IDENTIFIER_IDS : $SORTED_IDENTIFIER_IDS"/

  TOTAL_IDENTIFIER=${#HOSTS[@]}
  # echo "TOTAL_IDENTIFIER : $TOTAL_IDENTIFIER"

  for i in "${!IDENTIFIER_IDS[@]}"; do
    for j in "${!SORTED_IDENTIFIER_IDS[@]}"; do
      # last_element_index=${${TOTAL_IDENTIFIER}-1}
      # echo "last_element_index : $last_element_index"
      # echo "IDENTIFIER_IDS: ${IDENTIFIER_IDS[i]}"
      # echo "SORTED_IDENTIFIER_IDS: ${SORTED_IDENTIFIER_IDS[j]}"
      if [ "${IDENTIFIER_IDS[$i]}" = "${SORTED_IDENTIFIER_IDS[$j]}" ]; then
        # echo "j: ${j}"
        if [ ${j} = 0 ]; then
          NEIGHBORS_IDENTIFIER_IDS[i]="${SORTED_IDENTIFIER_IDS[TOTAL_IDENTIFIER-1]} ${SORTED_IDENTIFIER_IDS[${j}+1]}"
          NEIGHBORS_ADDRESSES[i]="${ADDRESSES[TOTAL_IDENTIFIER-1]} ${ADDRESSES[${j}+1]}"
        elif [ ${j} = $((TOTAL_IDENTIFIER-1)) ]; then
          NEIGHBORS_IDENTIFIER_IDS[i]="${SORTED_IDENTIFIER_IDS[${j}-1]} ${SORTED_IDENTIFIER_IDS[0]}"
          NEIGHBORS_ADDRESSES[i]="${ADDRESSES[${j}-1]} ${ADDRESSES[0]}"
        else
          NEIGHBORS_IDENTIFIER_IDS[i]="${SORTED_IDENTIFIER_IDS[${j}-1]} ${SORTED_IDENTIFIER_IDS[${j}+1]}"
          NEIGHBORS_ADDRESSES[i]="${ADDRESSES[${j}-1]} ${ADDRESSES[${j}+1]}"
        fi
      fi
    done
    NODE=${HOSTS[i]}
    # echo "NODE: ${NODE}"
    # echo "NEIGHBORS_IDENTIFIER_IDS: ${NEIGHBORS_IDENTIFIER_IDS[i]}"
    # echo "NEIGHBORS_ADDRESSES: ${NEIGHBORS_ADDRESSES[i]}"
    # ssh -f ${HOSTS[i]} "node /home/kla130/INF-3200-Distributed-Systems/Assignment1/code/app.js NEIGHBORS_IDENTIFIER_IDS=${NEIGHBORS_IDENTIFIER_IDS[i]} NEIGHBORS_ADDRESSES=${NEIGHBORS_ADDRESSES[i]}"
    # ssh -f ${HOSTS[i]} "cd $(pwd); "NEIGHBORS_IDENTIFIER_IDS=${NEIGHBORS_IDENTIFIER_IDS[i]} NEIGHBORS_ADDRESSES=${NEIGHBORS_ADDRESSES[i]} node app.js""
  done

  for l in "${!HOSTS[@]}"; do
    echo "NEIGHBORS_IDENTIFIER_IDS: ${NEIGHBORS_IDENTIFIER_IDS[l]}"
    echo "NEIGHBORS_ADDRESSES: ${NEIGHBORS_ADDRESSES[l]}"
    echo "PORT: ${PORTS[l]}"
    ssh -f ${HOSTS[i]} 'export PORT='"'${PORTS[l]}'"' NEIGHBORS_IDENTIFIER_IDS='"'${NEIGHBORS_IDENTIFIER_IDS[l]}'"' NEIGHBORS_ADDRESSES='"'${NEIGHBORS_ADDRESSES[l]}'"';node '"'$(pwd)'"'/app.js'
    # ssh -f compute-6-4 'export PORT=57777 NEIGHBORS_IDENTIFIER_IDS=999 NEIGHBORS_ADDRESSES=222;node '"'$(pwd)'"'/app.js'
    # ssh -f ${HOSTS[l]} "NEIGHBORS_IDENTIFIER_IDS=${NEIGHBORS_IDENTIFIER_IDS[l]} NEIGHBORS_ADDRESSES=${NEIGHBORS_ADDRESSES[l]} node /home/kla130/INF-3200-Distributed-Systems/Assignment1/code/app.js"
  done

fi

