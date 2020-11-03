# !/bin/bash -l

#pid=$(lsof -t -i:55555)
#a=(${pid})
# SCRIPT="kill \$(lsof -t -i:55555)"
#-- 'kill $(lsof -t -i:55555)'
echo "${a}"

LINE=1
while read -r NODE 
do
  ssh ${NODE} 'killall -9 node'
  exit
  ((LINE++))
done < "./hostfile"


