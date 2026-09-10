import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/features/auth";
import {
  closeSession,
  listTables,
  markTableCleaned,
  openTable,
  listTableSessions,
  type Table,
  type TableSession,
} from "@/features/tables";
import { useTable } from "@/hooks/useTable";
import { TableActionContent, type ManagedTable } from "@/components/tables";
import { IoMdHome } from "react-icons/io";


const statusVariant = {
  AVAILABLE: "default",
  OCCUPIED: "secondary",
  CLEANING: "warning",
} as const;

export default function TablesPage() {
  const { token } = useAuth();
  const [tables, setTables] = useState<ManagedTable[]>([]);
  const [tableSessions, setTableSessions] = useState<
    Record<string, TableSession>
  >({});
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);

  const selectedTable =
    tables.find((table) => table.id === selectedTableId) ?? null;
  const selectedTableSession = selectedTable
    ? (tableSessions[String(selectedTable.id)] ?? null)
    : null;
  const { canTransition, transitionTo } = useTable(selectedTable);

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedTableId(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - dragStartY.current;
    if (delta > 0) {
      setDragOffsetY(delta);
    } else {
      setDragOffsetY(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffsetY > 80) {
      handleCloseSheet();
    }
    setDragOffsetY(0);
    dragStartY.current = null;
  };

  useEffect(() => {
    if (!isSheetOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseSheet();
      }
    };

    const isMobileOrTablet = window.innerWidth < 1024;
    const originalOverflow = document.body.style.overflow;
    if (isMobileOrTablet) {
      document.body.style.overflow = "hidden";
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (isMobileOrTablet) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [isSheetOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        document.body.style.overflow = "";
      } else if (isSheetOpen) {
        document.body.style.overflow = "hidden";
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSheetOpen]);

  const loadTables = async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const nextTables = await listTables(token);
      const nextSessions = await listTableSessions(token);
      setTables(
        nextTables.map((table) => ({
          id: String(table.id),
          name: table.name,
          status: table.status,
          created_at: table.created_at,
          updated_at: table.updated_at,
        })),
      );

      setTableSessions(
        nextSessions.reduce(
          (acc, session) => {
            acc[String(session.table_id)] = session;
            return acc;
          },
          {} as Record<string, TableSession>,
        ),
      );

      setSelectedTableId((current) =>
        current && nextTables.some((table) => String(table.id) === current)
          ? current
          : null,
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load tables",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTables();
  }, [token]);

  const handleOpenTable = async (table: ManagedTable) => {
    if (!token) return;

    setSubmitting(true);
    setError("");

    try {
      const session = await openTable(String(table.id), token);
      const nextTableId = String(table.id);

      setTables((current) =>
        current.map((item) =>
          item.id === nextTableId
            ? {
                ...item,
                status: "OCCUPIED",
                session: {
                  token: session.qr_token,
                  openedAt: session.opened_at,
                  id: session.id,
                },
              }
            : item,
        ),
      );
      setTableSessions((current) => ({ ...current, [nextTableId]: session }));
      setSelectedTableId(nextTableId);
      transitionTo("OCCUPIED");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open table");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (table: ManagedTable) => {
    const sessionId =
      table.session?.id ??
      tableSessions[String(table.id)]?.id ??
      selectedTableSession?.id;
    if (!token || !sessionId) {
      setError("This table does not have an active session to close.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await closeSession(sessionId, token);
      setTables((current) =>
        current.map((item) =>
          item.id === table.id
            ? { ...item, status: "CLEANING", session: undefined }
            : item,
        ),
      );
      setTableSessions((current) => {
        const next = { ...current };
        delete next[String(table.id)];
        return next;
      });
      setSelectedTableId(null);
      setIsSheetOpen(false);
      transitionTo("CLEANING");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to close the table session",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkCleaned = async (table: ManagedTable) => {
    if (!token) return;

    setSubmitting(true);
    setError("");

    try {
      await markTableCleaned(String(table.id), token);
      setTables((current) =>
        current.map((item) =>
          item.id === table.id
            ? { ...item, status: "AVAILABLE", session: undefined }
            : item,
        ),
      );
      setTableSessions((current) => {
        const next = { ...current };
        delete next[String(table.id)];
        return next;
      });
      if (selectedTableId === table.id) {
        setSelectedTableId(null);
        setIsSheetOpen(false);
      }
      transitionTo("AVAILABLE");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to mark the table as cleaned",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              POS
            </p>
            <h1 className="mt-2 text-3xl font-bold">Tables</h1>
            <p className="mt-2 text-muted-foreground">
              Open a table session, share its QR link, and manage checkout.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            to="/dashboard"
          >
            <IoMdHome/>
            Back To Dashboard
          </Link>
        </div>

        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Table grid</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading tables..."
                  : `${tables.filter((table) => table.status === "AVAILABLE").length} available · ${tables.filter((table) => table.status === "OCCUPIED").length} occupied · ${tables.filter((table) => table.status === "CLEANING").length} cleaning`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="py-8 text-center text-muted-foreground">
                  Loading tables...
                </p>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      type="button"
                      className={`rounded-xl border p-4 text-left transition hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedTableId === table.id ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                      onClick={() => handleSelectTable(table.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">
                          {table.name}
                        </span>
                        <Badge variant={statusVariant[table.status]}>
                          {table.status}
                        </Badge>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">
                        {table.status === "AVAILABLE"
                          ? "Ready to open"
                          : table.status === "OCCUPIED"
                            ? "Session in progress"
                            : "Needs cleaning"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hidden h-fit lg:sticky lg:top-6 lg:block">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedTable ? selectedTable.name : "Table actions"}
                </CardTitle>
                {selectedTable ? (
                  <Badge variant={statusVariant[selectedTable.status]}>
                    {selectedTable.status}
                  </Badge>
                ) : null}
              </div>
              <CardDescription>
                {selectedTable
                  ? "Manage the current table session."
                  : "Select a table to begin."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTable ? (
                <p className="text-sm text-muted-foreground">
                  Choose a table from the grid.
                </p>
              ) : (
                <TableActionContent
                  table={selectedTable}
                  session={selectedTableSession}
                  submitting={submitting}
                  canTransition={canTransition}
                  onOpenTable={handleOpenTable}
                  onCheckout={handleCheckout}
                  onMarkCleaned={handleMarkCleaned}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Slide-up Action Bottom Sheet for Mobile & Tablet */}
      {isSheetOpen && selectedTable ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm lg:hidden animate-sheet-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleCloseSheet();
          }}
        >
          <section
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-border bg-background pb-6 shadow-2xl animate-sheet-panel sm:max-w-lg sm:border-x"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-table-title"
            style={{
              transform:
                dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
              transition: isDragging ? "none" : "transform 200ms ease-out",
            }}
          >
            {/* Drag handle */}
            <div
              className="flex cursor-grab touch-none select-none items-center justify-center pt-3 pb-1 active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={handleCloseSheet}
              role="button"
              tabIndex={0}
              aria-label="Drag down or tap to close"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleCloseSheet();
              }}
            >
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30 transition-colors hover:bg-muted-foreground/50" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2.5">
                <h2 id="sheet-table-title" className="text-xl font-semibold">
                  {selectedTable.name}
                </h2>
                <Badge variant={statusVariant[selectedTable.status]}>
                  {selectedTable.status}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
                onClick={handleCloseSheet}
                aria-label="Close table actions"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>

            {/* Content */}
            <div className="p-5">
              {error ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <p className="mb-4 text-sm text-muted-foreground">
                Manage the current table session.
              </p>
              <TableActionContent
                table={selectedTable}
                session={selectedTableSession}
                submitting={submitting}
                canTransition={canTransition}
                onOpenTable={handleOpenTable}
                onCheckout={handleCheckout}
                onMarkCleaned={handleMarkCleaned}
              />
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
