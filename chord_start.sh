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
    NODE_ID=$(node initialize_nodes.js)
    echo "$NODE_ID"
    echo "$LINE: $NODE"
    ssh -f $NODE "ID=$NODE_ID node /home/kla130/INF-3200-Distributed-Systems/Assignment1/code/app.js"
    # ssh -f $NODE "pwd"
    ((LINE++))
done < "./hostfile"
fi