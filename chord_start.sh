# !/bin/bash -l

if [ $# -lt 2 ]
  then
    echo "Usage: chord|demo num_hosts"
    exit
fi

sh generate_hosts.sh $2

if [ "$1" = "demo" ]; then
  LINE=1
  while read -r NODE
    do

      HOSTS[LINE-1]=$NODE
      PORTS[LINE-1]=$(( ( RANDOM % (65535-49152) ) + 49152 ))
      ADDRESSES[LINE-1]="${NODE}:${PORTS[LINE-1]}"

      ((LINE++))
  done < "./hostfile"
  
  # echo "ADDRESSES: ${ADDRESSES[*]}"

  NODE_IDENTIFIER_IDS_STRING=$(ADDRESSES=${ADDRESSES[*]} node initialize_nodes.js)
  # echo "IDENTIFIER_IDS_STRING : $IDENTIFIER_IDS_STRING"

  NODE_IDENTIFIER_IDS=(${NODE_IDENTIFIER_IDS_STRING// / })
  # echo "NODE_IDENTIFIER_IDS: ${NODE_IDENTIFIER_IDS[*]}"

  IFS=$'\n' SORTED_NODE_IDENTIFIER_IDS=($(sort <<<"${NODE_IDENTIFIER_IDS[*]}")); unset IFS

  # echo "SORTED_NODE_IDENTIFIER_IDS: ${SORTED_NODE_IDENTIFIER_IDS[*]}"

  TOTAL_NODE_IDENTIFIER=${#HOSTS[@]}
  # echo "TOTAL_NODE_IDENTIFIER : $TOTAL_NODE_IDENTIFIER"

  for i in "${!SORTED_NODE_IDENTIFIER_IDS[@]}"; do
    for j in "${!NODE_IDENTIFIER_IDS[@]}"; do
      if [ "${SORTED_NODE_IDENTIFIER_IDS[i]}" = "${NODE_IDENTIFIER_IDS[j]}" ]; then
        # Find neighbors
        if [ ${i} = 0 ]; then
          NEIGHBORS_IDENTIFIER_IDS[i]="${SORTED_NODE_IDENTIFIER_IDS[TOTAL_NODE_IDENTIFIER-1]} ${SORTED_NODE_IDENTIFIER_IDS[${i}+1]}"
          NEIGHBORS_ADDRESSES[i]="${ADDRESSES[TOTAL_NODE_IDENTIFIER-1]} ${ADDRESSES[${i}+1]}"
        elif [ ${i} = $((TOTAL_NODE_IDENTIFIER-1)) ]; then
          NEIGHBORS_IDENTIFIER_IDS[i]="${SORTED_NODE_IDENTIFIER_IDS[${i}-1]} ${SORTED_NODE_IDENTIFIER_IDS[0]}"
          NEIGHBORS_ADDRESSES[i]="${ADDRESSES[${i}-1]} ${ADDRESSES[0]}"
        else
          NEIGHBORS_IDENTIFIER_IDS[i]="${SORTED_NODE_IDENTIFIER_IDS[${i}-1]} ${SORTED_NODE_IDENTIFIER_IDS[${i}+1]}"
          NEIGHBORS_ADDRESSES[i]="${ADDRESSES[${i}-1]} ${ADDRESSES[${i}+1]}"
        fi

        SORTED_HOSTS[i]=${HOSTS[j]}
        SORTED_PORTS[i]=${PORTS[j]}
        SORTED_ADDRESSES[i]=${ADDRESSES[j]}

      fi
    done

  done

  # echo "SORTED_ADDRESSES: ${SORTED_ADDRESSES[*]}"
  # echo "NEIGHBORS_IDENTIFIER_IDS: ${NEIGHBORS_IDENTIFIER_IDS[*]}"


  LINE=1
  while read -r KEY_VALUE_PAIR
    do

      # Extract the key from the key-value pair and store it
      KEY_VALUE_PAIRS[LINE-1]=${KEY_VALUE_PAIR}

      # Extract the key from the key-value pair and store it
      KEY=(${KEY_VALUE_PAIR//,/ })
      KEYS[LINE-1]=${KEY[0]}
      VALUES[LINE-1]=${KEY[1]}

      ((LINE++))
  done < "./keysfile"

  # echo "VALUES: ${VALUES[*]}"

  HASHED_KEYS_STRING=$(KEYS=${KEYS[*]} node initialize_keys.js)
  # echo "HASHED_KEYS_STRING : $HASHED_KEYS_STRING"

  HASHED_KEYS=(${HASHED_KEYS_STRING// / })

  # echo "HASHED_KEYS: ${HASHED_KEYS[*]}"

  # IFS=$'\n' SORTED_HASHED_KEYS=($(sort <<<"${HASHED_KEYS[*]}")); unset IFS

  for i in "${!HASHED_KEYS[@]}"; do
    for j in "${!SORTED_NODE_IDENTIFIER_IDS[@]}"; do
      if [[ "${HASHED_KEYS[i]}" < "${SORTED_NODE_IDENTIFIER_IDS[j]}" ]]; then
        KEYS_SUCCESSOR[i]="${SORTED_NODE_IDENTIFIER_IDS[j]}"
        if [ -z "${OBJECT_MAP[j]}" ]; then
          # echo "Object map is empty for j=${j}"
          OBJECT_MAP[j]="${HASHED_KEYS[i]}:${KEY_VALUE_PAIRS[i]}"
          # echo "OBJECT_MAP[j]: ${OBJECT_MAP[j]}"
        else
          # echo "Object map is not empty for j=${j}"
          OBJECT_MAP[j]+=" ${HASHED_KEYS[i]}:${KEY_VALUE_PAIRS[i]}"
          # echo "OBJECT_MAP[j]: ${OBJECT_MAP[j]}"
        fi
        break
      elif [ ${j} = $((TOTAL_NODE_IDENTIFIER-1)) ]; then
        KEYS_SUCCESSOR[i]="${SORTED_NODE_IDENTIFIER_IDS[0]}"
        if [ -z "${OBJECT_MAP[0]}" ]; then
          # echo "Object map is empty for [0]"
          OBJECT_MAP[0]="${HASHED_KEYS[i]}:${KEY_VALUE_PAIRS[i]}"
          # echo "OBJECT_MAP[0]: ${OBJECT_MAP[0]}"
        else
          # echo "Object map is not empty for [0]"
          OBJECT_MAP[0]+=" ${HASHED_KEYS[i]}:${KEY_VALUE_PAIRS[i]}"
          # echo "OBJECT_MAP[0]: ${OBJECT_MAP[0]}"
        fi
      fi
    done
      # echo "OBJECT_MAP: ${OBJECT_MAP[i]}"
  done


  # echo "KEYS_SUCCESSOR: ${KEYS_SUCCESSOR[*]}"

  # echo "OBJECT_MAP[0]: ${OBJECT_MAP[0]}"
  # echo "OBJECT_MAP[1]: ${OBJECT_MAP[1]}"
  # echo "OBJECT_MAP[1]: ${OBJECT_MAP[2]}"

  # echo "SORTED_PORTS: ${SORTED_PORTS[*]}"

  # echo "NEIGHBORS_ADDRESSES: ${NEIGHBORS_ADDRESSES[*]}"



  for l in "${!SORTED_HOSTS[@]}"; do
    ssh -f ${SORTED_HOSTS[l]} 'export PORT='"'${SORTED_PORTS[l]}'"' NEIGHBORS_IDENTIFIER_IDS='"'${NEIGHBORS_IDENTIFIER_IDS[l]}'"' NEIGHBORS_ADDRESSES='"'${NEIGHBORS_ADDRESSES[l]}'"' OBJECT_MAP='"'${OBJECT_MAP[l]}'"';node '"'$(pwd)'"'/app.js'
  done

fi