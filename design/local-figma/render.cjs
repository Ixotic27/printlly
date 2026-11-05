const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
(async()=>{
  for(const file of fs.readdirSync(path.join(__dirname,'previews')).filter(f=>f.endsWith('.svg'))){
    const target=path.join(__dirname,'previews',file);
    const svg=fs.readFileSync(target,'utf8').replace(/href="\.\.\/([^\"]+)"/g,(_,asset)=>`href="data:image/png;base64,${fs.readFileSync(path.join(__dirname,asset)).toString('base64')}"`);
    await sharp(Buffer.from(svg)).png().toFile(target.replace(/\.svg$/,'.png'));
    console.log(file.replace(/\.svg$/,'.png'));
  }
})();
