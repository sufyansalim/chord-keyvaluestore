# !/bin/bash -l

if [ $# -lt 2 ]
  then
    echo "Usage: chord|demo num_hosts"
    exit
fi

# Use the "generate_hosts" to generate the nodes
sh generate_hosts.sh $2

# Read the hostfile to store the hostname, port and address for the nodes
LINE=1
while read -r NODE
  do

    HOSTS[LINE-1]=$NODE
    # Randomly assign a port from [49152 - 65535)
    PORTS[LINE-1]=$(( ( RANDOM % (65535-49152) ) + 49152 ))
    # The Address of the node in the format of hostname:port
    ADDRESSES[LINE-1]="${NODE}:${PORTS[LINE-1]}"

    ((LINE++))
done < "./hostfile"

# Use the address of the node as the key and the hash it
# The consistence hashing function is implemented inside the "hash_keys.js" file
# The identifier space is 256-bit
NODE_IDENTIFIER_IDS_STRING=$(KEYS=${ADDRESSES[*]} node hash_keys.js)

# Convert the node identifiers into array 
NODE_IDENTIFIER_IDS=(${NODE_IDENTIFIER_IDS_STRING// / })

# Sort the node identifiers
IFS=$'\n' SORTED_NODE_IDENTIFIER_IDS=($(sort <<<"${NODE_IDENTIFIER_IDS[*]}")); unset IFS

# Get the total number of node identifiers
TOTAL_NODE_IDENTIFIER=${#HOSTS[@]}

# Sort the hosts, ports and addresses according to order after hashing
for i in "${!SORTED_NODE_IDENTIFIER_IDS[@]}"; do
  for j in "${!NODE_IDENTIFIER_IDS[@]}"; do
    if [ "${SORTED_NODE_IDENTIFIER_IDS[i]}" = "${NODE_IDENTIFIER_IDS[j]}" ]; then
      SORTED_HOSTS[i]=${HOSTS[j]}
      SORTED_PORTS[i]=${PORTS[j]}
      SORTED_ADDRESSES[i]=${ADDRESSES[j]}
    fi
  done
done

# Store the neighbors for each node identifier
# After sorting as above, each node identifier will get its previous and next neighbor
# For node 0, its previous node will be the last node in order to create a ring
for i in "${!SORTED_NODE_IDENTIFIER_IDS[@]}"; do
  for j in "${!NODE_IDENTIFIER_IDS[@]}"; do
    if [ "${SORTED_NODE_IDENTIFIER_IDS[i]}" = "${NODE_IDENTIFIER_IDS[j]}" ]; then
      if [ ${i} = 0 ]; then
        NEIGHBORS_IDENTIFIER_IDS[i]="${SORTED_NODE_IDENTIFIER_IDS[TOTAL_NODE_IDENTIFIER-1]} ${SORTED_NODE_IDENTIFIER_IDS[${i}+1]}"
        NEIGHBORS_ADDRESSES[i]="${SORTED_ADDRESSES[TOTAL_NODE_IDENTIFIER-1]} ${SORTED_ADDRESSES[${i}+1]}"
      elif [ ${i} = $((TOTAL_NODE_IDENTIFIER-1)) ]; then
        NEIGHBORS_IDENTIFIER_IDS[i]="${SORTED_NODE_IDENTIFIER_IDS[${i}-1]} ${SORTED_NODE_IDENTIFIER_IDS[0]}"
        NEIGHBORS_ADDRESSES[i]="${SORTED_ADDRESSES[${i}-1]} ${SORTED_ADDRESSES[0]}"
      else
        NEIGHBORS_IDENTIFIER_IDS[i]="${SORTED_NODE_IDENTIFIER_IDS[${i}-1]} ${SORTED_NODE_IDENTIFIER_IDS[${i}+1]}"
        NEIGHBORS_ADDRESSES[i]="${SORTED_ADDRESSES[${i}-1]} ${SORTED_ADDRESSES[${i}+1]}"
      fi
    fi
  done
done

# Read the "keysfile" and store the key-value pairs
# The format of the key-value pairs is in the format [key],[value]
# Each line in the file contains one pair
LINE=1
while read -r KEY_VALUE_PAIR
  do
    # Extract key-value pair and store it
    KEY_VALUE_PAIRS[LINE-1]=${KEY_VALUE_PAIR}
    # Split the key-value pair and store it
    KEY=(${KEY_VALUE_PAIR//,/ })
    # Extract the key from the key-value pair and store it
    KEYS[LINE-1]=${KEY[0]}
    # Extract the value from the key-value pair and store it
    VALUES[LINE-1]=${KEY[1]}
    ((LINE++))
done < "./keysfile"

# Use the key of the key-value pair as the key and the hash it,
# using the same "initialize_nodes.js" file
HASHED_KEYS_STRING=$(KEYS=${KEYS[*]} node hash_keys.js)

# Convert the keys identifiers into array 
HASHED_KEYS=(${HASHED_KEYS_STRING// / })

# Create and store the successor for each key
# Create the object map for each node at the same time
for i in "${!HASHED_KEYS[@]}"; do
  for j in "${!SORTED_NODE_IDENTIFIER_IDS[@]}"; do
    if [[ "${HASHED_KEYS[i]}" < "${SORTED_NODE_IDENTIFIER_IDS[j]}" ]]; then
      KEYS_SUCCESSOR[i]="${SORTED_NODE_IDENTIFIER_IDS[j]}"
      # Handle the case if the object map is empty at the beginning
      if [ -z "${OBJECT_MAP[j]}" ]; then
        OBJECT_MAP[j]="${HASHED_KEYS[i]}:${KEY_VALUE_PAIRS[i]}"
      else
        OBJECT_MAP[j]+=" ${HASHED_KEYS[i]}:${KEY_VALUE_PAIRS[i]}"
      fi
      break
    elif [ ${j} = $((TOTAL_NODE_IDENTIFIER-1)) ]; then
      KEYS_SUCCESSOR[i]="${SORTED_NODE_IDENTIFIER_IDS[0]}"
      # Handle the case if the object map is empty at the beginning
      if [ -z "${OBJECT_MAP[0]}" ]; then
        OBJECT_MAP[0]="${HASHED_KEYS[i]}:${KEY_VALUE_PAIRS[i]}"
      else
        OBJECT_MAP[0]+=" ${HASHED_KEYS[i]}:${KEY_VALUE_PAIRS[i]}"
      fi
    fi
  done
done

# SSH to each node and start the server using "node app.js" command,
# parameters such as object map are passed as Environment variables into the server in the starting phrase
for l in "${!SORTED_HOSTS[@]}"; do
  ssh -f ${SORTED_HOSTS[l]} 'export PORT='"'${SORTED_PORTS[l]}'"' NEIGHBORS_IDENTIFIER_IDS='"'${NEIGHBORS_IDENTIFIER_IDS[l]}'"' NEIGHBORS_ADDRESSES='"'${NEIGHBORS_ADDRESSES[l]}'"' OBJECT_MAP='"'${OBJECT_MAP[l]}'"' INDEX='"'${l}'"' MY_ID='"'${SORTED_NODE_IDENTIFIER_IDS[l]}'"';node '"'$(pwd)'"'/app.js'
done