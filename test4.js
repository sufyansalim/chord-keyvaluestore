'use strict'

const port = process.env.PORT || "";
const nodeAddress = process.env.ADDRESS || "";
const address = nodeAddress.split(":")

console.log(address)

const options = {
    method: "POST",
    headers: {
        "Content-Type": "appliction/json",
    },
  };

const url = `http://${address[0]}:${address[1]}/node-info/`;


  async function recurse() {
   // if(condition) {

        try {

            const response = await fetch(url, options);
        
            let result = await response.json();   

            console.log(result)
        
            return {result}
        
          }catch(error){

            return ("Test Failed")

          }
        
    // } else {
    //     recurse();
    // }
 }

recurse()