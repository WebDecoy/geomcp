import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';
await mkdir('assets', { recursive: true });
const grid = Array.from({length:21},(_,i)=>`<path d="M${i*80} 0V800 M0 ${i*80}H1600"/>`).join('');
const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800" viewBox="0 0 1600 800">
<defs><pattern id="noise" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="#fff" opacity=".07"/></pattern><linearGradient id="beam" x1="0" x2="1"><stop stop-color="#d8ff55" stop-opacity="0"/><stop offset="1" stop-color="#d8ff55" stop-opacity=".16"/></linearGradient></defs>
<rect width="1600" height="800" fill="#101311"/><g stroke="#ffffff" opacity=".035" stroke-width="1">${grid}</g><rect width="1600" height="800" fill="url(#noise)"/>
<path d="M930 0H1600V800H1150Z" fill="url(#beam)"/>
<g font-family="Arial,Helvetica,sans-serif"><rect x="76" y="66" width="36" height="36" rx="8" fill="#d8ff55"/><path d="m86 84 7 7 10-17" stroke="#101311" stroke-width="4" fill="none"/>
<text x="128" y="94" fill="#f4f6ee" font-size="30" font-weight="700" letter-spacing="1">GEOMCP</text><text x="1480" y="91" text-anchor="end" fill="#b8c0b3" font-size="18" letter-spacing="3">BY WEBDECOY</text>
<rect x="76" y="178" width="295" height="32" rx="16" fill="#242c1d" stroke="#53652d"/><text x="95" y="200" fill="#d8ff55" font-size="14" letter-spacing="2">GEO AUDITS. INSIDE YOUR AI.</text>
<text x="69" y="332" fill="#f4f6ee" font-size="112" font-weight="800" letter-spacing="-6">GET FOUND.</text>
<text x="69" y="444" fill="#d8ff55" font-size="93" font-weight="800" letter-spacing="-5">SHOW YOUR</text><text x="69" y="546" fill="#d8ff55" font-size="93" font-weight="800" letter-spacing="-5">WORK.</text>
<text x="78" y="608" fill="#b8c0b3" font-size="25">Turn technical blind spots into evidence-backed fixes.</text>
<path d="M78 661H760" stroke="#34402c"/>
<text x="78" y="704" fill="#f4f6ee" font-size="16" letter-spacing="1">5 MCP TOOLS</text><text x="272" y="704" fill="#f4f6ee" font-size="16" letter-spacing="1">LOCAL FIRST</text><text x="470" y="704" fill="#f4f6ee" font-size="16" letter-spacing="1">OPEN SOURCE</text>
<g transform="translate(920 180)"><rect x="18" y="-18" width="530" height="478" rx="22" fill="#171e14" stroke="#41512b"/><rect width="530" height="478" rx="22" fill="#171c18" stroke="#687c48"/>
<circle cx="31" cy="30" r="5" fill="#d8ff55"/><text x="49" y="36" fill="#c7d1c0" font-size="16" font-family="monospace">audit_url</text><text x="498" y="36" text-anchor="end" fill="#839179" font-size="13">ILLUSTRATIVE OUTPUT</text>
<path d="M0 58H530" stroke="#35402f"/><text x="30" y="112" fill="#f4f6ee" font-size="28" font-weight="700">Every finding. The evidence.</text>
<text x="30" y="159" fill="#839179" font-family="monospace" font-size="14">CHECK</text><text x="498" y="159" text-anchor="end" fill="#839179" font-family="monospace" font-size="14">OBSERVED</text>
${[['Canonical URL','PASS','#d8ff55'],['Extractable HTML','PASS','#d8ff55'],['Publisher identity','REVIEW','#ffcd7a'],['HTTP response','UNKNOWN','#a6b0bf']].map((r,i)=>`<path d="M30 ${176+i*55}H500" stroke="#2e392b"/><text x="30" y="${210+i*55}" fill="#e1e7dc" font-size="21">${r[0]}</text><text x="498" y="${210+i*55}" text-anchor="end" fill="${r[2]}" font-size="14" font-family="monospace">${r[1]}</text>`).join('')}
<rect x="28" y="411" width="474" height="40" rx="6" fill="#d8ff55"/><text x="49" y="437" fill="#182010" font-size="16" font-weight="700">EVIDENCE → FIX → RE-AUDIT</text></g>
<text x="1450" y="704" text-anchor="end" fill="#95a387" font-size="16" font-family="monospace">github.com/WebDecoy/geomcp</text></g></svg>`;
const flow = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="400" viewBox="0 0 1600 400"><rect width="1600" height="400" rx="20" fill="#101311"/><g font-family="Arial,Helvetica,sans-serif"><text x="60" y="65" fill="#d8ff55" font-size="16" letter-spacing="3">A SHORTER PATH FROM QUESTION TO FIX</text>${[['01','ASK','Audit this landing page.'],['02','INSPECT','HTML, policies, discovery.'],['03','IMPROVE','Fix what the evidence shows.'],['04','VERIFY','Compare the next audit.']].map((x,i)=>`<g transform="translate(${60+i*382} 105)"><path d="M0 0H330" stroke="#39452d"/><text x="0" y="42" fill="#829175" font-size="20" font-family="monospace">${x[0]}</text><text x="0" y="111" fill="#f4f6ee" font-size="47" font-weight="700">${x[1]}</text><text x="0" y="156" fill="#b8c0b3" font-size="20">${x[2]}</text></g>`).join('')}<text x="60" y="345" fill="#829175" font-size="17">Your assistant gets structured evidence. You stay in control of changes.</text></g></svg>`;
for (const [name, svg] of [['cover',cover],['workflow',flow]]) {
  await writeFile(`assets/${name}.svg`, svg);
  await sharp(Buffer.from(svg)).png().toFile(`assets/${name}.png`);
}
await sharp('assets/cover.png').resize(1280,640).png().toFile('assets/social-preview.png');
console.log('Rendered assets/cover.png (1600×800) and assets/workflow.png (1600×400).');
