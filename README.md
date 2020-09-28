How to compile and run the code:

Download NVM:
  1. curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
  2. restart the terminal

Install NODE and packages:
  1. nvm install node
  2. npm install

Run the servers:
  1. [Optional] To initialize some pre-defined key-value pairs, create a "keysfile". The format of key-value pairs is [key],[value], one pair per line
  2. to start the servers, use "./chord_start demo [X]", where X is the number of hosts you want to use