const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Add compression import
if (!content.includes('import compression from "compression";')) {
  content = content.replace('import express from "express";', 'import express from "express";\nimport compression from "compression";');
}

// Add compression middleware
if (!content.includes('app.use(compression());')) {
  content = content.replace('app.disable("x-powered-by");', 'app.disable("x-powered-by");\n  app.use(compression()); // Compress all responses to reduce network egress');
}

fs.writeFileSync('server.ts', content);
