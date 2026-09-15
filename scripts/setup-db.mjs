import { resetStore, storePath } from '../src/lib/prisma.js';

resetStore();
console.log(`Local store initialized at ${storePath}`);
