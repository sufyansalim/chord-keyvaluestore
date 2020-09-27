# !/bin/bash -l

pid=$(lsof -t -i:55555)
a=(${pid})
# SCRIPT="kill \$(lsof -t -i:55555)"

echo "${a}"

LINE=1
while read -r NODE 
do
  ssh ${NODE} -- 'kill $(lsof -t -i:55555)'
  exit
  ((LINE++))
done < "./hostfile"


