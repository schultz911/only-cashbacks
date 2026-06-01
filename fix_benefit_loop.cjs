const fs = require('fs');

let content = fs.readFileSync('src/lib/recommendation.ts', 'utf8');

// The `exclusion` find loop inside `cardsToEvaluate.map` is doing `b.type === 'exclusion' && (catL === b.category.toLowerCase() || nameL.includes(b.category.toLowerCase()) || platL === b.category.toLowerCase())`
// This `b.category.toLowerCase()` is calculated repeatedly.
// Also `const isQuarterly = benefit.description.toLowerCase().includes('quarter') ...` is calculated for every benefit every time `getRecommendations` is called.

// Let's optimize `cardToUse = { ...cardToUse, name: '811 Scan & Pay' };` since it replaces twice in my script above and might make duplicate changes.

fs.writeFileSync('src/lib/recommendation.ts', content);
