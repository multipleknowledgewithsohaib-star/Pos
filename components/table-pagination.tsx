'use client';

type TablePaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

function getPaginationRange(currentPage: number, pageCount: number) {
  const delta = 2; // Number of pages to show before and after current page
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];
  let l: number | undefined;

  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l !== undefined) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l > 2) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}

export function TablePagination({ page, pageCount, total, pageSize, onPageChange }: TablePaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(page * pageSize, total);
  const paginationRange = getPaginationRange(page, pageCount);

  return (
    <div className="table-footer">
      <span>
        Showing {start} to {end} of {total} entries
      </span>
      <div className="pagination">
        <button aria-label="Previous page" disabled={page <= 1} type="button" onClick={() => onPageChange(page - 1)}>
          {'<'}
        </button>
        {paginationRange.map((item, index) => {
          if (item === '...') {
            return (
              <span
                key={`dots-${index}`}
                className="pagination-ellipsis"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 0.5rem',
                  color: '#888',
                  fontSize: '0.9rem',
                  userSelect: 'none',
                }}
              >
                ...
              </span>
            );
          }
          const pageNumber = item as number;
          return (
            <button
              className={pageNumber === page ? 'active' : undefined}
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          );
        })}
        <button
          aria-label="Next page"
          disabled={page >= pageCount}
          type="button"
          onClick={() => onPageChange(page + 1)}
        >
          {'>'}
        </button>
      </div>
    </div>
  );
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pageCount,
    rows: rows.slice(start, start + pageSize),
  };
}
