/**
 * Splits the compound path from cundinamarca-rea.svg into individual province paths.
 * Generates the final cundinamarca-svg.ts ready to use.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, '../src/assets/cundinamarca-rea.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const dMatch = svg.match(/d="([\s\S]+?)"\s*\/>/);
if (!dMatch) { console.error('No path data found'); process.exit(1); }

const rawD = dMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

// ─── Split compound path at sub-path boundaries (z followed by m) ─────────────
const rawSegments = rawD.split(/(?<=z)\s*(?=m)/i);

// Track absolute start of each sub-path
// After z, current point returns to START of current sub-path
// Next 'm dx dy' is relative to that start
let startX = 0, startY = 0;
const subpaths = [];

for (let i = 0; i < rawSegments.length; i++) {
  const seg = rawSegments[i].trim();

  if (i === 0) {
    const mMatch = seg.match(/^M\s*([-\d.]+)\s+([-\d.]+)/);
    if (!mMatch) { console.error('First segment has no M:', seg.substring(0, 40)); continue; }
    startX = parseFloat(mMatch[1]);
    startY = parseFloat(mMatch[2]);
    subpaths.push({ d: seg, startX, startY });
  } else {
    const mMatch = seg.match(/^m\s*([-\d.]+)\s+([-\d.]+)/i);
    if (!mMatch) { continue; }
    startX += parseFloat(mMatch[1]);
    startY += parseFloat(mMatch[2]);
    const fixedD = seg.replace(/^m\s*[-\d.]+\s+[-\d.]+/i, `M ${startX.toFixed(0)} ${startY.toFixed(0)}`);
    subpaths.push({ d: fixedD, startX, startY });
  }
}

// ─── Compute centroid for each sub-path ───────────────────────────────────────
// SVG transform: translate(0,1521) scale(0.1,-0.1)
// svgX = pathX * 0.1,  svgY = 1521 - pathY * 0.1
const VIEW_H = 1521;

function computeInfo(d) {
  const toks = d.match(/[MmCcLlHhVvZz]|[-+]?(?:\d+\.?\d*|\.\d+)/g) || [];
  let i = 0, cx = 0, cy = 0;
  const xs = [], ys = [];
  let cmd = '';

  const n = () => parseFloat(toks[i++] ?? '0');

  while (i < toks.length) {
    const t = toks[i];
    if (/^[MmCcLlHhVvZz]$/i.test(t)) { cmd = t; i++; continue; }

    switch (cmd) {
      case 'M': cx = n(); cy = n(); break;
      case 'm': cx += n(); cy += n(); break;
      case 'L': cx = n(); cy = n(); break;
      case 'l': cx += n(); cy += n(); break;
      case 'H': cx = n(); break;
      case 'h': cx += n(); break;
      case 'V': cy = n(); break;
      case 'v': cy += n(); break;
      case 'C': { n();n();n();n(); cx=n(); cy=n(); break; }
      case 'c': { const dx1=n(),dy1=n(),dx2=n(),dy2=n(),dx=n(),dy=n();
                  xs.push(cx+dx1,cx+dx2); ys.push(cy+dy1,cy+dy2);
                  cx+=dx; cy+=dy; break; }
      case 'Z': case 'z': break;
      default: i++; break;
    }
    xs.push(cx); ys.push(cy);
  }

  if (xs.length === 0) return null;
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const area = (maxX - minX) * (maxY - minY);
  const svgCx = ((minX + maxX) / 2) * 0.1;
  const svgCy = VIEW_H - ((minY + maxY) / 2) * 0.1;
  return { svgCx, svgCy, area };
}

// ─── Filter significant paths (exclude tiny artifacts) ───────────────────────
// Tiny paths 4, 12, 13, 19 (by original index) have area < 2M
const withInfo = subpaths.map((sp, i) => ({ ...sp, idx: i + 1, info: computeInfo(sp.d) }));

// The 4 paths to SKIP are those with the smallest computed areas
const sorted_by_area = [...withInfo].filter(sp => sp.info).sort((a, b) => a.info.area - b.info.area);
const SKIP_COUNT = 4; // skip the 4 smallest (artifacts)
const skipIdxs = new Set(sorted_by_area.slice(0, SKIP_COUNT).map(sp => sp.idx));

console.log('Skipping path indices (tiny artifacts):', [...skipIdxs].sort((a,b)=>a-b));

const significant = withInfo.filter(sp => sp.info && !skipIdxs.has(sp.idx));
console.log(`Significant paths: ${significant.length}`);

// ─── Province assignment (geographic heuristic, N→S W→E) ─────────────────────
// SVG coords: X left→right = W→E, Y top→bottom = N→S
// Assignments are APPROXIMATE — user should verify visually in the app
// Province IDs: 15 reales + 1 inventada (nueva-provincia)
// Asignados geográficamente N→S W→E — verificar visualmente en la app
const provinceIds = [
  { id: 'rionegro',          name: 'Rionegro' },
  { id: 'bajo-magdalena',    name: 'Bajo Magdalena' },
  { id: 'almeidas',          name: 'Almeidas' },
  { id: 'ubate',             name: 'Ubaté' },
  { id: 'guavio',            name: 'Guavio' },
  { id: 'magdalena-centro',  name: 'Magdalena Centro' },
  { id: 'sabana-centro',     name: 'Sabana Centro' },
  { id: 'gualiva',           name: 'Gualivá' },
  { id: 'oriente',           name: 'Oriente' },
  { id: 'medina',            name: 'Medina' },
  { id: 'sabana-occidente',  name: 'Sabana Occidente' },
  { id: 'nueva-provincia',   name: 'Nueva Provincia' },  // ← inventada
  { id: 'tequendama',        name: 'Tequendama' },
  { id: 'sumapaz',           name: 'Sumapaz' },
  { id: 'alto-magdalena',    name: 'Alto Magdalena' },
  { id: 'soacha',            name: 'Soacha' },
];

// Sort significant paths by centroid: primarily Y (N→S), secondarily X (W→E)
const sorted = [...significant].sort((a, b) => {
  const dy = a.info.svgCy - b.info.svgCy;
  if (Math.abs(dy) > 80) return dy;
  return a.info.svgCx - b.info.svgCx;
});

console.log('\nSorted paths with province assignments:');
sorted.forEach((sp, i) => {
  const prov = provinceIds[i] || { id: `extra-${i}`, name: `Extra ${i}` };
  console.log(`  ${String(i+1).padStart(2)}: path-${sp.idx} centroid(${sp.info.svgCx.toFixed(0)},${sp.info.svgCy.toFixed(0)}) → ${prov.id}`);
});

// ─── Generate cundinamarca-svg.ts ─────────────────────────────────────────────
const VIEW_W = 1346;

const output = `// Generated from cundinamarca-rea.svg
// Paths are in potrace coordinates. CundinamarcaMap.tsx wraps them with the SVG transform.
// Province ID assignments are APPROXIMATE — verify visually in the running app.

export interface ProvincePath {
  id: string;
  d: string;
  labelX: number; // SVG coordinate (after transform)
  labelY: number; // SVG coordinate (after transform)
}

export const PROVINCE_PATHS: ProvincePath[] = [
${sorted.slice(0, provinceIds.length).map((sp, i) => {
  const prov = provinceIds[i];
  return `  {
    id: '${prov.id}',
    d: \`${sp.d}\`,
    labelX: ${sp.info.svgCx.toFixed(1)},
    labelY: ${sp.info.svgCy.toFixed(1)},
  },`;
}).join('\n')}
];

export const SVG_VIEWBOX = '0 0 ${VIEW_W} ${VIEW_H}';
export const SVG_TRANSFORM = 'translate(0,${VIEW_H}) scale(0.1,-0.1)';
`;

const outPath = path.join(__dirname, '../src/data/cundinamarca-svg.ts');
fs.writeFileSync(outPath, output);
console.log(`\n✓ Written to ${outPath}`);
