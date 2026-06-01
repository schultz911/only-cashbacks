const fs = require('fs');

let content = fs.readFileSync('src/lib/recommendation.ts', 'utf8');

// The issue is `let cardToUse = { ...card };` is inside the loop `.map(card => {`.
// If we only mutate cardToUse when needed, or just return `{ ...card }` at the end ONLY if it was modified... wait, the only modification to `card` is `cardToUse.name = '811 Scan & Pay';`
// Let's refactor this to only clone the card when we actually modify it.

content = content.replace(
  `    let cardToUse = { ...card };`,
  `    let cardToUse = card; // Optimize: only clone if modification is needed`
);

content = content.replace(
  `        cardToUse.name = '811 Scan & Pay';`,
  `        cardToUse = { ...cardToUse, name: '811 Scan & Pay' };`
);

content = content.replace(
  `        cardToUse.name = '811 Scan & Pay';`,
  `        cardToUse = { ...cardToUse, name: '811 Scan & Pay' };`
);


// Another issue `const pLower = \`\${benefit.category} \${benefit.value} \${benefit.description || ''}\`.toLowerCase();`
// we can also see `const descLForOnline = ...`
// This creates strings on every iteration inside the inner loop.
// We should precompute these in `src/data/cards.ts` ideally, but we can't change that now, but wait, `cardsToEvaluate.map` -> `card.benefits.map`.
// Since we are limited to `recommendation.ts`, let's see if we can optimize other parts.

fs.writeFileSync('src/lib/recommendation.ts', content);
