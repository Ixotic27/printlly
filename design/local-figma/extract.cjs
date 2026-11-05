const fs = require('node:fs');
const path = require('node:path');
const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'document.json'), 'utf8'));
const nodes = d.nodeChanges;
const id = g => g ? `${g.sessionID}:${g.localID}` : null;
const map = new Map(nodes.map(n => [id(n.guid), n]));
const childMap = new Map();
for (const n of nodes) {
  const parent = id(n.parentIndex?.guid);
  if (!childMap.has(parent)) childMap.set(parent, []);
  childMap.get(parent).push(n);
}
for (const children of childMap.values()) children.sort((a,b) => (a.parentIndex?.position || '').localeCompare(b.parentIndex?.position || ''));
const archiveCache = new Map();
function archived(n) {
  const key = id(n.guid);
  if (archiveCache.has(key)) return archiveCache.get(key);
  const p = map.get(id(n.parentIndex?.guid));
  const value = /archive|superseded/i.test(n.name || '') || (p ? archived(p) : false);
  archiveCache.set(key, value);
  return value;
}
function prune(value, key = '') {
  if (/^(glyphs|fontMetaData|derivedTextData|fillGeometry|strokeGeometry|vectorNetwork|pluginData|editInfo|commandsBlob|imageThumbnail|prototypeInteractions)$/.test(key)) return undefined;
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(v => prune(v)).filter(v => v !== undefined);
  return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,prune(v,k)]).filter(([k,v]) => v !== undefined));
}
function hex(c) { return c ? '#' + ['r','g','b'].map(k => Math.round(c[k]*255).toString(16).padStart(2,'0')).join('').toUpperCase() : undefined; }
function hash(v) { if (!v) return null; if (typeof v === 'string') return v; return Buffer.from(Array.isArray(v) ? v : Object.values(v)).toString('hex'); }
const fields = ['type','name','visible','opacity','size','transform','fontSize','fontName','textAlignHorizontal','textAlignVertical','lineHeight','letterSpacing','textAutoResize','fillPaints','strokePaints','strokeWeight','strokeAlign','rectangleTopLeftCornerRadius','rectangleTopRightCornerRadius','rectangleBottomLeftCornerRadius','rectangleBottomRightCornerRadius','effects','stackMode','stackSpacing','stackHorizontalPadding','stackVerticalPadding','stackPaddingRight','stackPaddingBottom','stackPrimarySizing','stackCounterSizing','stackPrimaryAlignItems','stackCounterAlignItems','stackPositioning','constraints','minSize','maxSize','frameMaskDisabled','description','symbolDescription','variableConsumptionMap','parameterConsumptionMap','variableModeMap','symbolData','derivedSymbolData'];
fields.push('componentPropAssignments','componentPropDefs','componentPropRefs','styleIdForText','variableModeBySetMap');
function pathData(index) {
  const blob=d.blobs[index]?.bytes;if(!blob)return '';
  const b=Buffer.from(Object.values(blob)),commands=['Z','M','L','Q','C'],counts=[0,2,2,4,6];let i=0,result=[];
  while(i<b.length) {const op=b[i++];if(op>4)throw Error(`Unknown path opcode ${op}`);let args=[];for(let j=0;j<counts[op];j++){args.push(Number(b.readFloatLE(i).toFixed(4)));i+=4;}result.push(commands[op]+args.join(' '));}
  return result.join(' ').replace(/^Z\s*/, '');
}
let previewMode=false;
function compact(n) {
  const out = {id:id(n.guid), parent:id(n.parentIndex?.guid)};
  for (const k of fields) if (n[k] !== undefined) out[k] = prune(n[k],k);
  if (n.textData) out.text = n.textData.characters;
  if (n.derivedTextData?.glyphs?.length) {
    out.renderedGlyphFontSizes=[...new Set(n.derivedTextData.glyphs.map(g=>g.fontSize))];
    if(out.renderedGlyphFontSizes.length===1)out.effectiveFontSize=out.renderedGlyphFontSizes[0];
    out.renderedFonts=n.derivedTextData.fontMetaData?.map(f=>({family:f.key.family,style:f.key.style,weight:f.fontWeight}));
    const baselines=n.derivedTextData.baselines||[];
    out.renderedBaselineDistances=baselines.slice(1).map((b,i)=>b.position.y-baselines[i].position.y);
  }
  if(n.type==='VECTOR')out.vectorPaths=(n.fillGeometry||[]).map(g=>({d:pathData(g.commandsBlob),windingRule:g.windingRule}));
  if(previewMode) {
    out.renderPaths=(n.fillGeometry||[]).map(g=>({d:pathData(g.commandsBlob),windingRule:g.windingRule}));
    out.renderStrokePaths=(n.strokeGeometry||[]).map(g=>({d:pathData(g.commandsBlob),windingRule:g.windingRule}));
    out.renderGlyphs=(n.derivedTextData?.glyphs||[]).map(g=>({d:pathData(g.commandsBlob),position:g.position,fontSize:g.fontSize}));
  }
  if (n.textData?.characterStyleOverrides) out.characterStyleOverrides = n.textData.characterStyleOverrides;
  if (n.textData?.styleOverrideTable) out.styleOverrideTable = prune(n.textData.styleOverrideTable);
  if (n.textData) out.textData = prune(n.textData);
  out.fillPaints?.forEach(p => { if (p.color) p.hex = hex(p.color); });
  return out;
}
function tree(n) { return {...compact(n), children:(childMap.get(id(n.guid)) || []).filter(c => !archived(c) && !['KEYFRAME','KEYFRAME_TRACK'].includes(c.type)).map(tree)}; }
function ancestorModes(n) {
  const ancestors=[];let current=n;while(current){ancestors.unshift(current);current=map.get(id(current.parentIndex?.guid));}
  const modes=new Map();for(const node of ancestors)for(const e of node.variableModeBySetMap?.entries||[])modes.set(id(e.variableSetID.guid),id(e.variableModeID));
  return modes;
}
function expanded(n, inherited = [], chain = [], props = new Map(), modes = ancestorModes(n)) {
  const sourceId = id(n.guid);
  const changes = inherited.filter(o => id(o.guidPath?.guids?.at(-1)) === sourceId);
  let merged = Object.assign({}, n, ...changes);
  modes=new Map(modes);for(const e of merged.variableModeBySetMap?.entries||[])modes.set(id(e.variableSetID.guid),id(e.variableModeID));
  for(const key of ['fillPaints','strokePaints'])if(merged[key])merged[key]=merged[key].map(p=>{
    const variable=map.get(id(p.colorVar?.value?.alias?.guid));
    if(!variable)return p;
    const set=id(variable.variableSetID?.guid),value=resolve(variable,modes.get(set));
    return value?.hex?{...p,color:{r:value.r,g:value.g,b:value.b,a:value.a}}:p;
  });
  if(changes.some(o => o.textData)) merged.textData = {...n.textData,...changes.findLast(o=>o.textData).textData};
  props=new Map(props);
  for(const assignment of merged.componentPropAssignments||[])props.set(id(assignment.defID),assignment.varValue?.value||assignment.value);
  const refs=[...(merged.componentPropRefs||[]).map(r=>({id:id(r.defID),field:r.componentPropNodeField})),...(merged.parameterConsumptionMap?.entries||[]).filter(e=>e.variableData?.value?.propRefValue).map(e=>({id:id(e.variableData.value.propRefValue.defId),field:e.variableField}))];
  for(const ref of refs){const v=props.get(ref.id);if(!v)continue;if(ref.field==='TEXT_DATA')merged.textData=v.textDataValue||v.textValue;if(ref.field==='VISIBLE')merged.visible=v.boolValue;}
  const out = compact(merged);
  out.id = sourceId;
  let children = childMap.get(sourceId) || [];
  let overrides = inherited;
  if(merged.type === 'INSTANCE' && merged.symbolData?.symbolID) {
    const componentId=id(merged.symbolData.symbolID);
    const component=map.get(componentId);
    out.componentId=componentId;
    if(component && !chain.includes(componentId)) {
      children=childMap.get(componentId)||[];
      overrides=[...inherited,...(merged.symbolData.symbolOverrides||[]),...(merged.derivedSymbolData||[])];
      chain=[...chain,componentId];
      out.componentName=component.name;
    }
  }
  out.children=children.filter(c=>!['KEYFRAME','KEYFRAME_TRACK'].includes(c.type) && !/archive|superseded/i.test(c.name||'')).map(c=>expanded(c,overrides,chain,props,modes));
  return out;
}
const active = nodes.filter(n => !archived(n));
const write = (name,value) => fs.writeFileSync(path.join(__dirname,name),JSON.stringify(value,null,2));
const pages = nodes.filter(n => n.type === 'CANVAS' && !n.internalOnly && !archived(n));
const screenIndex = [];
const imageUsage=[];
function multiply(p,t) {return {m00:p.m00*t.m00+p.m01*t.m10,m01:p.m00*t.m01+p.m01*t.m11,m02:p.m00*t.m02+p.m01*t.m12+p.m02,m10:p.m10*t.m00+p.m11*t.m10,m11:p.m10*t.m01+p.m11*t.m11,m12:p.m10*t.m02+p.m11*t.m12+p.m12};}
const identity={m00:1,m01:0,m02:0,m10:0,m11:1,m12:0};
function collectImages(n,screen,parent=identity,trail=[],root=true) {
  if(n.visible===false||n.opacity===0)return;
  const m=multiply(parent,root?identity:n.transform||identity),ancestry=[...trail,n.name];
  for(const paint of n.fillPaints||[])if(paint.type==='IMAGE'&&paint.visible!==false){
    const w=n.size?.x||0,h=n.size?.y||0,points=[[0,0],[w,0],[0,h],[w,h]].map(([x,y])=>({x:m.m00*x+m.m01*y+m.m02,y:m.m10*x+m.m11*y+m.m12}));
    const minx=Math.min(...points.map(p=>p.x)),miny=Math.min(...points.map(p=>p.y)),maxx=Math.max(...points.map(p=>p.x)),maxy=Math.max(...points.map(p=>p.y));
    imageUsage.push({screen:screen.id,screenName:screen.name,page:screen.page,node:n.id,name:n.name,ancestry,hash:hash(paint.image?.hash||paint.imageHash),bounds:{x:minx,y:miny,width:maxx-minx,height:maxy-miny},scaleMode:paint.imageScaleMode,transform:paint.transform});
  }
  const scale=n.symbolData?.uniformScaleFactor??1,childMatrix=multiply(m,{...identity,m00:scale,m11:scale});
  for(const c of n.children||[])collectImages(c,screen,childMatrix,ancestry,false);
}
fs.mkdirSync(path.join(__dirname,'screens'),{recursive:true});
fs.mkdirSync(path.join(__dirname,'expanded'),{recursive:true});
for (const p of pages) {
  const roots=(childMap.get(id(p.guid))||[]).filter(n=>!archived(n) && ['FRAME','SECTION','SYMBOL'].includes(n.type));
  for (const n of roots) {
    const filename = `screens/${id(n.guid).replace(':','-')}.json`;
    write(filename,tree(n));
    const expandedFile=`expanded/${id(n.guid).replace(':','-')}.json`;
    if(/^(04 Website|05 Mobile|06 Partner|14 Mobile|15 Avatars|02 Components)/.test(p.name)) {
      const ex=expanded(n);write(expandedFile,ex);collectImages(ex,{id:id(n.guid),name:n.name,page:p.name});
    }
    screenIndex.push({id:id(n.guid),page:p.name,name:n.name,size:n.size,file:filename,expandedFile});
  }
}
write('screen-index.json',screenIndex);
write('image-usage.json',imageUsage);
write('active-nodes.json',active.filter(n=>!['KEYFRAME','KEYFRAME_TRACK'].includes(n.type)).map(compact));
const sets=nodes.filter(n=>n.type==='VARIABLE_SET');
const vars=nodes.filter(n=>n.type==='VARIABLE');
function resolve(v,mode,seen=new Set()) {
  if (!v) return null;
  const e=v.variableDataValues?.entries || [];
  const data=(e.find(x=>id(x.modeID)===mode)||e[0])?.variableData;
  if (!data) return null;
  const value=data.value;
  if (value?.alias) { const alias=id(value.alias.guid); if(seen.has(alias))return null;seen.add(alias); return resolve(map.get(alias),mode,seen); }
  if(value?.colorValue)return {hex:hex(value.colorValue),...value.colorValue};
  return value;
}
write('variables.json', sets.map(s => ({
  id:id(s.guid), name:s.name,
  modes:s.variableSetModes.map(m => ({id:id(m.id),name:m.name})),
  variables:vars.filter(v => id(v.variableSetID?.guid)===id(s.guid)).map(v => ({
    id:id(v.guid),name:v.name,type:v.variableResolvedType,description:v.description,codeSyntax:v.codeSyntax,
    values:s.variableSetModes.map(m => ({
      mode:m.name,modeId:id(m.id),resolved:resolve(v,id(m.id)),
      raw:v.variableDataValues?.entries.find(e=>id(e.modeID)===id(m.id))?.variableData
    }))
  }))
})));
const imageSlots=[];
for(const n of active) for(const p of n.fillPaints||[])if(p.type==='IMAGE') imageSlots.push({node:id(n.guid),name:n.name,size:n.size,parent:id(n.parentIndex?.guid),paint:prune(p),hash:hash(p.image?.hash || p.imageHash)});
write('image-slots.json',imageSlots);
write('component-index.json',active.filter(n=>n.type==='SYMBOL').map(compact));
const assets=[];
fs.mkdirSync(path.join(__dirname,'assets'),{recursive:true});
for(const slot of imageSlots) {
  const source=path.join(__dirname,'archive/images',slot.hash);
  if(!fs.existsSync(source))continue;
  const bytes=fs.readFileSync(source);
  const ext=bytes.subarray(0,4).toString('hex')==='89504e47'?'png':bytes[0]===255&&bytes[1]===216?'jpg':bytes.subarray(0,4).toString()==='RIFF'?'webp':'bin';
  const filename=`assets/${slot.hash}.${ext}`;
  fs.copyFileSync(source,path.join(__dirname,filename));
  let ancestry=[],n=map.get(slot.node);
  while(n){ancestry.push(n.name);n=map.get(id(n.parentIndex?.guid));}
  ancestry.reverse();
  assets.push({...slot,file:filename,ancestry,eligibleCustomerAvatar: (ancestry.some(name=>name==='Canonical / 18 profile avatars') || slot.name.startsWith('Approved portrait /'))&&!/(mascot|admin)/i.test(slot.name)});
}
write('assets-manifest.json',assets);
// A local reference render from exported geometry/glyph outlines. It is
// diagnostic output, never an implementation asset or replacement for UI.
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
let clipSequence=0;
function svgNode(n,root=false) {
  if(n.visible===false||n.opacity===0)return '';
  const t=root?{m00:1,m01:0,m02:0,m10:0,m11:1,m12:0}:n.transform||{m00:1,m01:0,m02:0,m10:0,m11:1,m12:0};
  const matrix=`${t.m00} ${t.m10} ${t.m01} ${t.m11} ${t.m02} ${t.m12}`;
  let parts=[],defs=[];
  const w=n.size?.x||0,h=n.size?.y||0,r=n.rectangleTopLeftCornerRadius||0;
  const clipId='clip'+n.id.replace(':','-')+'_'+clipSequence++;
  if(n.frameMaskDisabled===false)defs.push(`<clipPath id="${clipId}"><rect width="${w}" height="${h}" rx="${r}"/></clipPath>`);
  for(const paint of n.fillPaints||[]) {
    if(paint.visible===false)continue;
    if(paint.type==='IMAGE'){
      const key=hash(paint.image?.hash||paint.imageHash),asset=assets.find(a=>a.hash===key);
      if(asset)parts.push(`<image href="../${asset.file}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid ${paint.imageScaleMode==='FIT'?'meet':'slice'}" opacity="${paint.opacity??1}"/>`);
    } else if(paint.type==='SOLID') {
      const color=hex(paint.color),opacity=(paint.opacity??1)*(paint.color?.a??1);
      if(n.type==='TEXT') for(const g of n.renderGlyphs||[])parts.push(`<path d="${g.d}" transform="translate(${g.position.x} ${g.position.y}) scale(${g.fontSize} ${-g.fontSize})" fill="${color}" opacity="${opacity}"/>`);
      else if(n.renderPaths?.length)for(const p of n.renderPaths)parts.push(`<path d="${p.d}" fill="${color}" fill-rule="${p.windingRule==='ODD'?'evenodd':'nonzero'}" opacity="${opacity}"/>`);
      else if(n.type==='ELLIPSE')parts.push(`<ellipse cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}" fill="${color}" opacity="${opacity}"/>`);
      else if(w&&h)parts.push(`<rect width="${w}" height="${h}" rx="${r}" fill="${color}" opacity="${opacity}"/>`);
    }
  }
  for(const paint of n.strokePaints||[])if(paint.visible!==false&&paint.type==='SOLID')for(const p of n.renderStrokePaths||[])parts.push(`<path d="${p.d}" fill="${hex(paint.color)}" opacity="${paint.opacity??1}"/>`);
  const scale=n.symbolData?.uniformScaleFactor??1;
  parts.push(`<g${scale!==1?` transform="scale(${scale})"`:''}>${(n.children||[]).map(c=>svgNode(c)).join('')}</g>`);
  return `<g transform="matrix(${matrix})" opacity="${n.opacity??1}">${defs.length?`<defs>${defs.join('')}</defs>`:''}<g${n.frameMaskDisabled===false?` clip-path="url(#${clipId})"`:''}>${parts.join('')}</g></g>`;
}
fs.mkdirSync(path.join(__dirname,'previews'),{recursive:true});
previewMode=true;
const previewIds=['81:1871','81:1961','81:2051','106:2437','81:2141','81:2199','81:8094','81:8147','81:8200','81:8265','75:1387','78:8052','78:8247','78:8337','102:10740','102:11326'];
previewIds.push('81:8628','81:8684','81:8729','83:9421','83:9499','106:4955',...process.argv.slice(2));
for(const key of previewIds){const n=map.get(key),t=expanded(n);fs.writeFileSync(path.join(__dirname,'previews',key.replace(':','-')+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="${n.size.x}" height="${n.size.y}" viewBox="0 0 ${n.size.x} ${n.size.y}">${svgNode(t,true)}</svg>`);}
const vectorIds=['284:498','284:501','284:505','284:510','284:516','284:521','265:493'];
const vectorManifest=[];
for(const key of vectorIds) {
  const n=map.get(key),file=`assets/vector-${key.replace(':','-')}.svg`,t=expanded(n);
  fs.writeFileSync(path.join(__dirname,file),`<svg xmlns="http://www.w3.org/2000/svg" width="${n.size.x}" height="${n.size.y}" viewBox="0 0 ${n.size.x} ${n.size.y}">${svgNode(t,true)}</svg>`);
  vectorManifest.push({id:key,name:n.name,file,size:n.size,source:'Original vector master decoded from local .fig; no geometry redrawn'});
}
write('vector-assets.json',vectorManifest);
console.log(JSON.stringify({active:active.length,screens:screenIndex.length,images:imageSlots.length,variables:vars.length,components:active.filter(n=>n.type==='SYMBOL').length}));
