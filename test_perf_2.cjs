const fs = require('fs');

let content = fs.readFileSync('src/lib/recommendation.ts', 'utf8');

// There are strings and object created in map loop
const objCreation = /let cardToUse = \{ \.\.\.card \};/g;

if(objCreation.test(content)){
    console.log("Memory memory constraints found, optimization should be done on memory constraints by avoiding inline creation in loop");
}
