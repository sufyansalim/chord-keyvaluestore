# This is an Iplementation of the Chord Paper in JavaScript

```
Chord: A scalable peer-to-peer lookup service for internet applications
```
[Click Here to Read the Paper](https://dl.acm.org/doi/10.1145/964723.383071)

How to compile and run the code:

Download NVM:
  1. curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
  2. restart the terminal

Install NODE and packages:
  1. nvm install node
  2. npm install

Run the servers:
  1. [Optional] To initialize some pre-defined key-value pairs, create a "keysfile". The format of key-value pairs is [key],[value], one pair per line
  2. to start the servers, use "./chord_start X Y", where X start-chord to start chord and Y num of hosts
  3. to start single servers not joined, use "./chord_start X", X is single-nodes and Y num of hosts

Run the test:
  1. start the servers, use "./chord_tests X"
  2. use "./chord_tests X", where x can be "getNeighbors" for testing GET Neighbors API, "getstorageItem" for testing GET data API, and "putstorageItem" for testing PUt data API
  3. use "./chord_tests X", where X can be "grow" for testing Growing from 1 to n nodes, "shrink" for testing from n nodes to n/2, and "tolerance" for testing crashing the nodes
