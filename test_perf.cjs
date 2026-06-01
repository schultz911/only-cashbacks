const fs = require('fs');

let content = fs.readFileSync('src/lib/recommendation.ts', 'utf8');

const regex = /const isExcludedCatCache = DEFAULT_EXCLUSIONS\.find\(ex => catL\.includes\(ex\) \|\| nameL\.includes\(ex\) \|\| platL\.includes\(ex\)\);/g;

if(regex.test(content)){
    console.log("Memory memory constraints found, optimization should be done on memory constraints by avoiding inline creation in loop");
} else {
    console.log("Not found");
}
