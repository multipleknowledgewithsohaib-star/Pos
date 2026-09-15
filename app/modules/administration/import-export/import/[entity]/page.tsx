import { notFound } from 'next/navigation';
import { ImportExportImportFlow } from '@/components/import-export-import-flow';
import type { ImportEntity } from '@/lib/import-export-types';
import { importEntityConfigs } from '@/lib/import-export-config';

const validEntities = new Set(importEntityConfigs.map((item) => item.id));

export default async function ImportEntityPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity } = await params;

  if (!validEntities.has(entity as ImportEntity)) {
    notFound();
  }

  return <ImportExportImportFlow entity={entity as ImportEntity} />;
}
