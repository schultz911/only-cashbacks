const fs = require('fs');

let content = fs.readFileSync('src/lib/recommendation.ts', 'utf8');

// Replace the first occurrence of filtering `walletCards` dynamically within the function to outside the map
if (content.includes('const cardsToEvaluate = walletCards')) {
  console.log("Found cardsToEvaluate logic, checking if we need to optimize");
}

fs.writeFileSync('src/lib/recommendation.ts', content);
