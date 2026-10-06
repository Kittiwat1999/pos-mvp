import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Armchair, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import ActionConfirmModal from "@/components/common/ActionConfirmModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBackdrop,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createTable,
  deleteTable,
  listTableSessions,
  settingListTables,
  updateTable,
  type Table,
  type TableSession,
  type ActiveFilter,
} from "@/features/tables";
import { useAuth } from "@/features/auth";
import SettingsSidebar from "@/components/layout/SettingsSidebar";
import { cn } from "@/lib/utils";

const tableFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Table name is required")
    .max(50, "Name must be 50 characters or fewer"),
  capacity: z.coerce
    .number()
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1"),
});

type TableFormInput = z.input<typeof tableFormSchema>;
type TableFormValues = z.output<typeof tableFormSchema>;

const statusStyle: Record<
  Table["status"],
  {
    label: string;
    variant: "default" | "secondary" | "warning" | "destructive";
  }
> = {
  AVAILABLE: { label: "Available", variant: "default" },
  OCCUPIED: { label: "Occupied", variant: "destructive" },
  CLEANING: { label: "Cleaning", variant: "warning" },
};

function readPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default function TableSettingsPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";
  const activeParam = searchParams.get("active");
  const activeFilter: ActiveFilter =
    activeParam === "true" || activeParam === "false" ? activeParam : "";
  const page = readPositiveInteger(searchParams.get("page"), 1);
  const limit = readPositiveInteger(searchParams.get("limit"), 10);

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [tables, setTables] = useState<Table[]>([]);
  const [tableTotalCount, setTableTotalCount] = useState<number>(0);
  const [sessions, setSessions] = useState<TableSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  const form = useForm<TableFormInput, unknown, TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: { name: "", capacity: 4 },
  });

  const loadTables = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [tableResponse, nextSessions] = await Promise.all([
        settingListTables(
          {
            search: searchQuery,
            active: activeFilter,
            page: page,
            limit: limit,
          },
          token,
        ),
        listTableSessions(token),
      ]);
      setTables(tableResponse.tables);
      setTableTotalCount(tableResponse.total_count);
      setSessions(nextSessions);
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
  }, [token, searchParams]);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (searchInput.trim() === searchQuery) return;
    const timeout = window.setTimeout(() => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (searchInput.trim()) next.set("search", searchInput.trim());
          else next.delete("search");
          next.delete("page");
          return next;
        },
        { replace: true },
      );
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput, searchQuery, setSearchParams]);

  const pageCount = Math.max(1, Math.ceil(tableTotalCount / limit));
  const pageStart = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pageNumbers = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => pageStart + index,
  );
  const firstItem = tableTotalCount === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, tableTotalCount);

  useEffect(() => {
    if (page > pageCount) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (pageCount === 1) next.delete("page");
          else next.set("page", String(pageCount));
          return next;
        },
        { replace: true },
      );
    }
  }, [page, pageCount, setSearchParams]);

  const setPage = (nextPage: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextPage <= 1) next.delete("page");
      else next.set("page", String(nextPage));
      return next;
    });
  };

  const setFilter = (value: ActiveFilter) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("active", value);
      next.delete("page");
      return next;
    });
  };

  const setPageSize = (value: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("limit", value);
      next.delete("page");
      return next;
    });
  };

  const openCreateDialog = () => {
    setEditingTable(null);
    form.reset({ name: "", capacity: 4 });
    setDialogOpen(true);
  };

  const openEditDialog = (table: Table) => {
    setEditingTable(table);
    form.reset({ name: table.name, capacity: table.capacity ?? 4 });
    setDialogOpen(true);
  };

  const handleSave = async (values: TableFormValues) => {
    if (!token) return;
    try {
      if (editingTable) {
        const updated = await updateTable(editingTable.id, values, token);
        setTables((current) =>
          current.map((table) =>
            table.id === updated.id
              ? { ...table, ...updated, ...values }
              : table,
          ),
        );
        toast.success("Table updated successfully");
      } else {
        const created = await createTable({ ...values, active: true }, token);
        setTables((current) => [
          ...current,
          { ...created, ...values, active: created.active ?? true },
        ]);
        toast.success("Table created successfully");
      }
      setDialogOpen(false);
      await loadTables();
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to save the table",
      );
    }
  };

  const handleToggleActive = async (table: Table) => {
    if (!token) return;
    const nextActive = table.active === false;
    try {
      const updated = await updateTable(
        table.id,
        { active: nextActive },
        token,
      );
      setTables((current) =>
        current.map((item) =>
          item.id === table.id
            ? { ...item, ...updated, active: nextActive }
            : item,
        ),
      );
      toast.success(`Table ${nextActive ? "activated" : "deactivated"}`);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to update the table",
      );
    }
  };

  const hasOpenSession = (table: Table, openSessions: TableSession[]) =>
    table.status === "OCCUPIED" ||
    openSessions.some(
      (session) =>
        String(session.table_id) === String(table.id) &&
        session.status === "OPEN",
    );

  const requestDelete = (table: Table) => {
    if (hasOpenSession(table, sessions)) {
      toast.warning(
        "Cannot delete table with an active session. Please close or complete the session first.",
      );
      return;
    }
    setTableToDelete(table);
  };

  const confirmDelete = async () => {
    if (!token || !tableToDelete) return;
    try {
      const openSessions = await listTableSessions(token);
      if (hasOpenSession(tableToDelete, openSessions)) {
        setSessions(openSessions);
        setTableToDelete(null);
        toast.warning(
          "Cannot delete table with an active session. Please close or complete the session first.",
        );
        return;
      }
      await deleteTable(tableToDelete.id, token);
      setTables((current) =>
        current.filter((table) => table.id !== tableToDelete.id),
      );
      setTableToDelete(null);
      toast.success("Table deleted successfully");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to delete the table",
      );
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "mb-3 -ml-2",
              )}
              to="/dashboard"
            >
              <ArrowLeft />
              Back to dashboard
            </Link>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Settings
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Table Settings
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage dining table details and availability.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="size-4" />
            Add Table
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <SettingsSidebar />
          <Card className="min-w-0">
            <CardHeader className="gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Dining tables</CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search table name"
                    aria-label="Search table name"
                    className="pl-9 pr-9"
                  />
                  {searchInput ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Clear search"
                      className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
                      onClick={() => setSearchInput("")}
                    >
                      <X className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <div
                  className="flex gap-1 rounded-md border border-border p-1"
                  aria-label="Filter by active state"
                >
                  {(
                    [
                      ["", "All"],
                      ["true", "Active"],
                      ["false", "Inactive"],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={label}
                      type="button"
                      size="sm"
                      variant={activeFilter === value ? "secondary" : "ghost"}
                      aria-pressed={activeFilter === value}
                      onClick={() => setFilter(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>

            {error ? (
              <div className="p-4 pb-0">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : null}

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Capacity</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Active</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-muted-foreground"
                        >
                          Loading tables...
                        </td>
                      </tr>
                    ) : error ? null : tables.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-muted-foreground"
                        >
                          {tableTotalCount === 0
                            ? "No tables found."
                            : "No tables on this page."}
                        </td>
                      </tr>
                    ) : (
                      tables.map((table) => {
                        const active = table.active !== false;
                        const status = statusStyle[table.status];
                        return (
                          <tr key={table.id} className="border-t border-border">
                            <td className="px-5 py-4 font-medium text-foreground">
                              {table.name}
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">
                              <span className="inline-flex items-center gap-2">
                                <Armchair className="size-4" />
                                {table.capacity ?? 4} Seats
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <Badge variant={status.variant}>
                                {status.label}
                              </Badge>
                            </td>
                            <td className="px-5 py-4">
                              <Badge variant={active ? "default" : "outline"}>
                                {active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  aria-label={`Edit ${table.name}`}
                                  title="Edit table"
                                  onClick={() => openEditDialog(table)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void handleToggleActive(table)}
                                >
                                  {active ? "Inactivate" : "Activate"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Delete ${table.name}`}
                                  title="Delete table"
                                  onClick={() => requestDelete(table)}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {firstItem}–{lastItem} of {tableTotalCount} tables
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    Rows
                    <Select
                      aria-label="Rows per page"
                      value={String(limit)}
                      onChange={(event) => setPageSize(event.target.value)}
                      className="w-20"
                    >
                      {[10, 20, 50].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    {pageNumbers.map((pageNumber) => (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === page ? "secondary" : "ghost"}
                        size="icon"
                        className="size-8"
                        aria-label={`Page ${pageNumber}`}
                        aria-current={pageNumber === page ? "page" : undefined}
                        disabled={loading}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pageCount || loading}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>
                {editingTable ? "Edit table" : "Add table"}
              </DialogTitle>
              <DialogDescription>
                {editingTable
                  ? "Update the table name and seating capacity."
                  : "Add a dining table to the floor."}
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(handleSave)}
            >
              <label className="block space-y-2 text-sm font-medium">
                Table name <span className="text-destructive">*</span>
                <Input
                  maxLength={50}
                  placeholder="e.g. Patio 1"
                  {...form.register("name")}
                />
                {form.formState.errors.name ? (
                  <span className="block text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </span>
                ) : null}
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Capacity <span className="text-destructive">*</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  {...form.register("capacity", { valueAsNumber: true })}
                />
                {form.formState.errors.capacity ? (
                  <span className="block text-sm text-destructive">
                    {form.formState.errors.capacity.message}
                  </span>
                ) : null}
              </label>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : editingTable
                      ? "Save changes"
                      : "Add table"}
                </Button>
              </DialogFooter>
            </form>
          </DialogPopup>
        </DialogPortal>
      </Dialog>

      <ActionConfirmModal
        isOpen={Boolean(tableToDelete)}
        onClose={() => setTableToDelete(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title={`Delete ${tableToDelete?.name ?? "table"}?`}
        description="This action cannot be undone. Tables with an active session cannot be deleted."
        confirmText="Delete table"
      />
    </main>
  );
}
