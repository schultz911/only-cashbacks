const exclusions = ['fuel', 'wallet', 'rent', 'housing', 'gambling', 'gaming', 'tolls', 'toll', 'finance', 'school', 'education', 'jewellery', 'insurance', 'railway', 'rail', 'government', 'tax', 'utilities', 'utility', 'bills', 'bill', 'telecom', 'internet', 'atm', 'cash', 'charity', 'donation'];
const name = 'amazon';
const found = exclusions.find(ex => name.includes(ex));
console.log('Exclusion found:', found);
