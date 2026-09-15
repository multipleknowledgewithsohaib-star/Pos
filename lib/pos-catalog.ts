export type PosMedicine = {
  id: number;
  name: string;
  barcode: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  batchNo?: string;
};

export const posMedicineCatalog: PosMedicine[] = [
  {
    id: 1,
    name: 'BABY SPOON',
    barcode: 'B-S 001',
    category: 'Baby Care',
    unit: 'SINGLE PAC',
    price: 50,
    stock: 1000,
    batchNo: 'B-S 001',
  },
  {
    id: 2,
    name: 'BABY COMF',
    barcode: 'B-C 001',
    category: 'Baby Care',
    unit: 'SINGLE PAC',
    price: 531,
    stock: 800,
    batchNo: 'B-C 001',
  },
];
