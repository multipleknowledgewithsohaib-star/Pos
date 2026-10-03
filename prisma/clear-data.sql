PRAGMA foreign_keys = OFF;
DELETE FROM "StockMovement";
DELETE FROM "Batch";
DELETE FROM "Product";
DELETE FROM "Supplier";
DELETE FROM "Category";
DELETE FROM sqlite_sequence;
PRAGMA foreign_keys = ON;
