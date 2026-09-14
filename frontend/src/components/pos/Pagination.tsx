import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

type PosPaginationProps = {
  currentPage: number;
  pageCount: number;
  setPage: (page: number) => void;
};

export function PosPagination({
  currentPage,
  pageCount,
  setPage,
}: PosPaginationProps) {
  const safePageCount = Math.max(1, pageCount);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safePageCount);

  const visiblePages: Array<number | "ellipsis-start" | "ellipsis-end"> = (() => {
    if (safePageCount <= 3) {
      return Array.from({ length: safePageCount }, (_, index) => index + 1);
    }

    if (safeCurrentPage <= 2) {
      return [1, 2, 3, "ellipsis-end", safePageCount];
    }

    if (safeCurrentPage >= safePageCount - 1) {
      return [1, "ellipsis-start", safePageCount - 2, safePageCount - 1, safePageCount];
    }

    return [
      1,
      "ellipsis-start",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "ellipsis-end",
      safePageCount,
    ];
  })();

  const handlePrevious = () => {
    if (safeCurrentPage > 1) setPage(safeCurrentPage - 1);
  };

  const handleNext = () => {
    if (safeCurrentPage < safePageCount) setPage(safeCurrentPage + 1);
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(event) => {
              event.preventDefault();
              handlePrevious();
            }}
            aria-disabled={safeCurrentPage === 1}
            className={safeCurrentPage === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {visiblePages.map((page) =>
          typeof page === "number" ? (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === safeCurrentPage}
                onClick={(event) => {
                  event.preventDefault();
                  setPage(page);
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationEllipsis />
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(event) => {
              event.preventDefault();
              handleNext();
            }}
            aria-disabled={safeCurrentPage === safePageCount}
            className={
              safeCurrentPage === safePageCount ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}