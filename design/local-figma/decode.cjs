// Read-only decoder for the user's exported .fig archive payload.
const fs = require('node:fs');
const zlib = require('node:zlib');
const kiwi = require('kiwi-schema');
const { decompress } = require('fzstd');
const payload = fs.readFileSync(__dirname + '/archive/canvas.fig');
if (payload.subarray(0, 8).toString() !== 'fig-kiwi') throw Error('Unexpected file header');
let offset = 12;
const chunks = [];
while (offset < payload.length) {
  const length = payload.readUInt32LE(offset);
  offset += 4;
  chunks.push(payload.subarray(offset, offset + length));
  offset += length;
}
function inflate(chunk) {
  return chunk.readUInt32LE(0) === 0xfd2fb528 ? decompress(chunk) : zlib.inflateRawSync(chunk);
}
const schema = kiwi.decodeBinarySchema(inflate(chunks[0]));
const codec = kiwi.compileSchema(schema);
const message = codec.decodeMessage(inflate(chunks[1]));
fs.writeFileSync(__dirname + '/schema.json', JSON.stringify(schema, null, 2));
fs.writeFileSync(__dirname + '/document.json', JSON.stringify(message, (key, value) => typeof value === 'bigint' ? value.toString() : value));
console.log(JSON.stringify({ version: payload.readUInt32LE(8), chunks: chunks.map(c => c.length), keys: Object.keys(message), nodeCount: message.nodeChanges?.length }));
