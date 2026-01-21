import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const PATCH_DIR_RE = /^motionSense\d+$/;

export const dynamic = 'force-dynamic';

export async function GET() {
  const publicDir = path.join(process.cwd(), 'public');
  let entries = [];
  try {
    entries = await fs.readdir(publicDir, { withFileTypes: true });
  } catch (err) {
    return NextResponse.json(
      { patches: [], error: err?.message || 'Failed to read public folder' },
      { status: 200 },
    );
  }

  const patches = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (!PATCH_DIR_RE.test(name)) continue;
    const exportFile = `${name}.export.json`;
    const exportPath = path.join(publicDir, name, exportFile);
    try {
      await fs.access(exportPath);
    } catch {
      continue;
    }
    patches.push({
      id: name,
      label: name,
      path: `/${name}/${exportFile}`,
    });
  }

  patches.sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }),
  );

  return NextResponse.json({ patches });
}
