const fs = require('fs');
const path = '/Users/mandeep/Documents/Metroway- Delhi Metro App, Map/mobile/src/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "marginTop: 10 },",
  "marginTop: 10, paddingBottom: 400 }, // Extra padding to cover screen bottom when dragged up\n"
);

fs.writeFileSync(path, content);
console.log("Patched index.tsx padding");
