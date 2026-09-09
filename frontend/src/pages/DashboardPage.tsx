import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StaffSidebar from "@/components/layout/StaffSidebar";
import SummaryCards from "@/components/pos/SummaryCards";
import TableStatus from "@/components/pos/TableStatus";
import RecentOrdersTable from "@/components/order/RecentOrdersTable";

const summaryCards = [
  { label: "Tables", value: "12 free", change: "+3 today" },
  { label: "Pending Orders", value: "8", change: "2 need action" },
  { label: "Revenue", value: "฿24,560", change: "+12.4%" },
];

const recentOrders = [
  {
    id: "#1042",
    table: "T-02",
    item: "Pad Kra Pao",
    total: "฿160",
    status: "Cooking",
  },
  {
    id: "#1043",
    table: "T-05",
    item: "Iced Tea x2",
    total: "฿120",
    status: "Ready",
  },
  {
    id: "#1044",
    table: "T-07",
    item: "Tom Yum Soup",
    total: "฿220",
    status: "Pending",
  },
];

const tableStatus = [
  { name: "T-01", status: "Available", variant: "default" as const },
  { name: "T-02", status: "Occupied", variant: "secondary" as const },
  { name: "T-03", status: "Cleaning", variant: "outline" as const },
  { name: "T-04", status: "Available", variant: "default" as const },
];

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <StaffSidebar className="hidden min-h-screen shrink-0 lg:flex" />

        <section className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Dialog.Root
                    open={mobileNavOpen}
                    onOpenChange={setMobileNavOpen}
                  >
                    <Dialog.Trigger
                      render={
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 lg:hidden"
                          aria-label="Open navigation"
                        />
                      }
                    >
                      <MenuIcon className="size-5" />
                    </Dialog.Trigger>

                    <Dialog.Portal>
                      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 lg:hidden" />
                      <Dialog.Popup className="fixed inset-y-0 left-0 z-50 w-[min(18rem,100vw)] max-w-full overflow-hidden outline-none transition-transform duration-300 ease-out data-ending-style:-translate-x-full data-starting-style:-translate-x-full lg:hidden">
                        <Dialog.Title className="sr-only">
                          Staff navigation
                        </Dialog.Title>
                        <Dialog.Description className="sr-only">
                          Navigate staff console pages and account actions.
                        </Dialog.Description>
                        <div className="relative h-full max-w-full overflow-hidden">
                          <Dialog.Close
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 z-10"
                                aria-label="Close navigation"
                              />
                            }
                          >
                            <CloseIcon className="size-5" />
                          </Dialog.Close>
                          <StaffSidebar
                            className="h-full max-h-dvh w-full max-w-full overflow-y-auto overflow-x-hidden"
                            onNavigate={() => setMobileNavOpen(false)}
                          />
                        </div>
                      </Dialog.Popup>
                    </Dialog.Portal>
                  </Dialog.Root>

                  <div className="min-w-0">
                    <CardDescription>Dashboard</CardDescription>
                    <CardTitle className="mt-2 text-2xl md:text-3xl">
                      Operations Overview
                    </CardTitle>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Button variant="outline">Export</Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <SummaryCards cards={summaryCards} />

          <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="min-w-0">
              <RecentOrdersTable orders={recentOrders} />
            </div>
            <div className="min-w-0">
              <TableStatus tables={tableStatus} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
