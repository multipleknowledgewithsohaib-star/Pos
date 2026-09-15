import type { PosCartLine } from '@/lib/pos-state';

export type InventorySyncResult = {
  ok: boolean;
  message?: string;
};

export async function syncInventoryAfterSale(items: PosCartLine[]): Promise<InventorySyncResult> {
  const stockItems = items.filter((item) => item.qty > 0);
  if (stockItems.length === 0) {
    return { ok: true };
  }

  try {
    const saleQtyByInventory = new Map<number, { name: string; qty: number }>();

    for (const item of stockItems) {
      if (item.medicineId === null) {
        return { ok: false, message: `${item.name} inventory (medicineId is null) check fail.` };
      }
      const current = saleQtyByInventory.get(item.medicineId);
      saleQtyByInventory.set(item.medicineId, {
        name: item.name,
        qty: (current?.qty ?? 0) + item.qty,
      });
    }

    const entries = Array.from(saleQtyByInventory.entries());
    const stockChecks = await Promise.all(
      entries.map(async ([medicineId, entry]) => {
        const response = await fetch(`/api/modules/inventory/${medicineId}`, { cache: 'no-store' });
        if (!response.ok) {
          return { ok: false, message: `${entry.name} details load nahi ho sake.`, medicineId, nextStock: 0 };
        }
        const payload = await response.json();
        const currentStock = Number(payload.data?.stock) || 0;
        if (entry.qty > currentStock) {
          return {
            ok: false,
            message: `${entry.name} ka stock ${currentStock} hai, sale qty ${entry.qty} hai.`,
            medicineId,
            nextStock: 0,
          };
        }
        return { ok: true, message: '', medicineId, nextStock: Math.max(0, currentStock - entry.qty) };
      }),
    );

    const checkFailed = stockChecks.find((res) => !res.ok);
    if (checkFailed) {
      return { ok: false, message: checkFailed.message };
    }

    const updates = await Promise.all(
      stockChecks.map(async (check) => {
        const updateResponse = await fetch(`/api/modules/inventory/${check.medicineId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stock: check.nextStock }),
        });
        return updateResponse.ok;
      }),
    );

    if (updates.some((ok) => !ok)) {
      return { ok: false, message: 'Inventory stock update nahi ho saka. Sale complete nahi hui.' };
    }

    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, message: 'Inventory stock update mein error aaya. Sale complete nahi hui.' };
  }
}

export async function syncInventoryAfterReturnExchange(
  returnedItems: Array<{ medicineId: number | null; name: string; returnQty: number; restock: boolean }>,
  exchangeItems: Array<{ medicineId: number | null; name: string; qty: number }>,
): Promise<InventorySyncResult> {
  try {
    // 1. Stock validation for exchange items first
    const exchangeStockItems = exchangeItems.filter((item) => item.qty > 0);
    const exchangeQtyMap = new Map<number, { name: string; qty: number }>();

    for (const item of exchangeStockItems) {
      if (item.medicineId === null) {
        return { ok: false, message: `${item.name} inventory (medicineId is null) check fail.` };
      }
      const current = exchangeQtyMap.get(item.medicineId);
      exchangeQtyMap.set(item.medicineId, {
        name: item.name,
        qty: (current?.qty ?? 0) + item.qty,
      });
    }

    // Check stock for all exchange items
    for (const [medicineId, entry] of exchangeQtyMap.entries()) {
      const response = await fetch(`/api/modules/inventory/${medicineId}`, { cache: 'no-store' });
      if (!response.ok) {
        return { ok: false, message: `${entry.name} inventory details load nahi ho sake.` };
      }
      const payload = await response.json();
      const currentStock = Number(payload.data?.stock) || 0;
      if (entry.qty > currentStock) {
        return {
          ok: false,
          message: `${entry.name} ka stock ${currentStock} hai, exchange required ${entry.qty} hai.`,
        };
      }
    }

    // 2. Restock returned items if restock is enabled
    const restockItems = returnedItems.filter((item) => item.restock && item.returnQty > 0 && item.medicineId !== null);
    for (const item of restockItems) {
      if (item.medicineId) {
        try {
          const fetchRes = await fetch(`/api/modules/inventory/${item.medicineId}`, { cache: 'no-store' });
          if (fetchRes.ok) {
            const payload = await fetchRes.json();
            const currentStock = Number(payload.data?.stock) || 0;
            await fetch(`/api/modules/inventory/${item.medicineId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stock: currentStock + item.returnQty }),
            });
          }
        } catch (error) {
          console.warn(`Could not restock item ${item.name}`, error);
        }
      }
    }

    // 3. Deduct stock for exchange items
    for (const [medicineId, entry] of exchangeQtyMap.entries()) {
      try {
        const fetchRes = await fetch(`/api/modules/inventory/${medicineId}`, { cache: 'no-store' });
        if (fetchRes.ok) {
          const payload = await fetchRes.json();
          const currentStock = Number(payload.data?.stock) || 0;
          await fetch(`/api/modules/inventory/${medicineId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: Math.max(0, currentStock - entry.qty) }),
          });
        }
      } catch (error) {
        console.warn(`Could not deduct exchange item ${entry.name}`, error);
      }
    }

    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, message: 'Return/Exchange inventory sync mein error aaya.' };
  }
}
