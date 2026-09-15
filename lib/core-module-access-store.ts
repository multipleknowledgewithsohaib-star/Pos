import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CoreSettings } from './core-settings';
import { defaultCoreSettings } from './core-settings';

const storePath = path.join(process.cwd(), 'data', 'core-module-access.json');

export async function readCoreModuleAccess(): Promise<CoreSettings> {
  try {
    const raw = await readFile(storePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CoreSettings>;
    return { ...defaultCoreSettings, ...parsed };
  } catch {
    await writeCoreModuleAccess(defaultCoreSettings);
    return structuredClone(defaultCoreSettings);
  }
}

export async function writeCoreModuleAccess(settings: CoreSettings) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
}

export async function patchCoreModuleAccess(patch: Partial<CoreSettings>) {
  const current = await readCoreModuleAccess();
  const next = { ...current, ...patch };
  await writeCoreModuleAccess(next);
  return next;
}
