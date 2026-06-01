const fs = require('fs');
let content = fs.readFileSync('src/lib/recommendation.ts', 'utf8');

// There is one more issue:
// `const isQuarterly = benefit.description.toLowerCase().includes('quarter') || benefit.description.toLowerCase().includes('qtr');`
// `benefit.description` is repeated.
// `currentQuarterCycle` and `getCycleForCard(card.id, cardBillDates)` are called but `currentQuarterCycle` is precomputed outside the loop.
// `getCycleForCard` is called per benefit per card, but cycle per card is constant for all benefits. We can precompute this per card.

content = content.replace(
  `    } else {
      let matchedBenefitValue = -1;
      let usedBenefit = null;

      if (isExcluded) {
        // Skip benefit matching for excluded cards
      } else {

        for (const benefit of card.benefits) {`,
  `    } else {
      let matchedBenefitValue = -1;
      let usedBenefit = null;

      if (isExcluded) {
        // Skip benefit matching for excluded cards
      } else {
        const cardCycle = getCycleForCard(card.id, cardBillDates); // Optimize: compute once per card

        for (const benefit of card.benefits) {`
);

content = content.replace(
  `          const isQuarterly = benefit.description.toLowerCase().includes('quarter') || benefit.description.toLowerCase().includes('qtr');
          const cycle = isQuarterly ? currentQuarterCycle : getCycleForCard(card.id, cardBillDates);`,
  `          const bDescL = benefit.description.toLowerCase();
          const isQuarterly = bDescL.includes('quarter') || bDescL.includes('qtr');
          const cycle = isQuarterly ? currentQuarterCycle : cardCycle;`
);

// replace `benefit.description.toLowerCase()` with `bDescL`
content = content.replace(
  `            const descL = benefit.description.toLowerCase();`,
  `            const descL = bDescL;`
);

fs.writeFileSync('src/lib/recommendation.ts', content);
