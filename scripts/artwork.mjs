import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
await mkdir('assets', { recursive: true });
// WebDecoy's existing mascot and website brand tokens; keep originals intact.
const duck = `data:image/svg+xml;base64,${(await readFile('assets/webdecoy-duck.svg')).toString('base64')}`;
const colors = { pink: '#ff2a6d', teal: '#00d1b7', background: '#090b0e', muted: '#b9bec4' };
const grid = Array.from({ length: 21 }, (_, i) => `<path d="M${i * 80} 0V800 M0 ${i * 80}H1600"/>`).join('');
const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800" viewBox="0 0 1600 800">
<defs><radialGradient id="halo"><stop stop-color="${colors.pink}" stop-opacity=".22"/><stop offset="1" stop-color="${colors.pink}" stop-opacity="0"/></radialGradient></defs>
<rect width="1600" height="800" fill="${colors.background}"/><g stroke="#fff" opacity=".035">${grid}</g>
<ellipse cx="1240" cy="445" rx="510" ry="480" fill="url(#halo)"/>
<g fill="none" stroke="${colors.pink}" opacity=".2"><circle cx="1235" cy="430" r="290"/><circle cx="1235" cy="430" r="340"/><circle cx="1235" cy="430" r="390"/></g>
<g font-family="Arial,Helvetica,sans-serif">
<image href="${duck}" x="70" y="48" width="66" height="72"/>
<text x="153" y="94" fill="#fff" font-size="37" font-weight="700" letter-spacing="-1">WebDecoy</text><path d="M356 68V103" stroke="#4c3440"/><text x="379" y="94" fill="${colors.pink}" font-size="30" font-weight="700" letter-spacing="1">GEOMCP</text>
<text x="1480" y="89" text-anchor="end" fill="${colors.muted}" font-size="17" letter-spacing="3">OPEN SOURCE · MCP SERVER</text>
<rect x="76" y="173" width="354" height="34" rx="17" fill="#26121b" stroke="#6c2940"/><text x="96" y="196" fill="${colors.pink}" font-size="14" letter-spacing="2">GEO AUDITS FOR YOUR AI ASSISTANT</text>
<text x="69" y="333" fill="#fff" font-size="98" font-weight="800" letter-spacing="-5">AUDIT YOUR</text>
<text x="69" y="444" fill="${colors.pink}" font-size="93" font-weight="800" letter-spacing="-5">SITE FOR</text>
<text x="69" y="546" fill="${colors.pink}" font-size="93" font-weight="800" letter-spacing="-5">AI SEARCH.</text>
<text x="78" y="608" fill="${colors.muted}" font-size="24">Find technical SEO issues. Get fixes in your AI assistant.</text>
<path d="M78 661H780" stroke="#3a2630"/><text x="78" y="704" fill="#fff" font-size="16" letter-spacing="1">5 MCP TOOLS</text><circle cx="252" cy="699" r="3" fill="${colors.pink}"/><text x="278" y="704" fill="#fff" font-size="16" letter-spacing="1">LOCAL FIRST</text><circle cx="444" cy="699" r="3" fill="${colors.pink}"/><text x="470" y="704" fill="#fff" font-size="16" letter-spacing="1">MIT LICENSED</text>
<image href="${duck}" x="945" y="156" width="570" height="621"/>
<g transform="translate(940 617)"><rect width="580" height="62" rx="10" fill="#101318" stroke="#61404e"/><circle cx="26" cy="31" r="5" fill="${colors.teal}"/><text x="44" y="37" fill="#fff" font-size="17" font-family="monospace">AUDIT → FIX → VERIFY</text><text x="552" y="37" text-anchor="end" fill="${colors.pink}" font-size="15" font-family="monospace">GEOMCP</text></g>
<text x="1230" y="721" text-anchor="middle" fill="${colors.muted}" font-size="16" font-family="monospace">github.com/WebDecoy/geomcp</text>
</g></svg>`;
const flow = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="400" viewBox="0 0 1600 400"><rect width="1600" height="400" rx="20" fill="${colors.background}"/><g font-family="Arial,Helvetica,sans-serif"><text x="60" y="65" fill="${colors.pink}" font-size="16" letter-spacing="3">WEBDECOY / GEOMCP — FROM QUESTION TO FIX</text>${[['01','ASK','Audit this landing page.'],['02','INSPECT','HTML, policies, discovery.'],['03','IMPROVE','Fix what the evidence shows.'],['04','VERIFY','Compare the next audit.']].map((x,i)=>`<g transform="translate(${60+i*382} 105)"><path d="M0 0H330" stroke="#512738"/><text x="0" y="42" fill="${colors.pink}" font-size="20" font-family="monospace">${x[0]}</text><text x="0" y="111" fill="#fff" font-size="47" font-weight="700">${x[1]}</text><text x="0" y="156" fill="${colors.muted}" font-size="20">${x[2]}</text></g>`).join('')}<text x="60" y="345" fill="${colors.muted}" font-size="17">Your assistant gets structured evidence. You stay in control of changes.</text><image href="${duck}" x="1468" y="292" width="70" height="76"/></g></svg>`;
for (const [name, svg] of [['cover',cover],['workflow',flow]]) {
  await writeFile(`assets/${name}.svg`, svg);
  await sharp(Buffer.from(svg)).png().toFile(`assets/${name}.png`);
}
await sharp('assets/cover.png').resize(1280,640).png().toFile('assets/social-preview.png');
console.log('Rendered WebDecoy-branded cover, workflow and social preview.');
