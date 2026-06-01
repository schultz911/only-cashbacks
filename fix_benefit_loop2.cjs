const fs = require('fs');
let content = fs.readFileSync('src/lib/recommendation.ts', 'utf8');

// Optimize the exclusion check inside the map to avoid repeating b.category.toLowerCase() inside the find.

content = content.replace(
  `    const exclusion = card.benefits.find(b =>
      b.type === 'exclusion' &&
      (catL === b.category.toLowerCase() || nameL.includes(b.category.toLowerCase()) || platL === b.category.toLowerCase())
    );`,
  `    const exclusion = card.benefits.find(b => {
      if (b.type !== 'exclusion') return false;
      const bCatL = b.category.toLowerCase(); // Optimize string allocation
      return catL === bCatL || nameL.includes(bCatL) || platL === bCatL;
    });`
);

content = content.replace(
  `          const descLForOnline = \`\${benefit.category} \${benefit.value} \${benefit.description || ''}\`.toLowerCase();`,
  `          const descLForOnline = (benefit.category + " " + benefit.value + " " + (benefit.description || '')).toLowerCase();`
);

content = content.replace(
  `          const pLower = \`\${benefit.category} \${benefit.value} \${benefit.description || ''}\`.toLowerCase();`,
  `          const pLower = descLForOnline; // Reuse already calculated lowercase string`
);

fs.writeFileSync('src/lib/recommendation.ts', content);
