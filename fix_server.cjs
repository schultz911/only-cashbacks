const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace('app.disable("x-powered-by");\n  app.use(compression()); // Compress all responses to reduce network egress // Security: Hide Express technology stack', 'app.disable("x-powered-by"); // Security: Hide Express technology stack\n  app.use(compression()); // Compress all responses to reduce network egress');
fs.writeFileSync('server.ts', content);
