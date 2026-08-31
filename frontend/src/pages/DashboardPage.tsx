import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StaffSidebar from '@/components/layout/StaffSidebar';
import SummaryCards from '@/components/pos/SummaryCards';
import TableStatus from '@/components/pos/TableStatus';
import RecentOrdersTable from '@/components/order/RecentOrdersTable';

const summaryCards = [
  { label: 'Tables', value: '12 free', change: '+3 today' },
  { label: 'Pending Orders', value: '8', change: '2 need action' },
  { label: 'Revenue', value: '฿24,560', change: '+12.4%' },
];

const recentOrders = [
  { id: '#1042', table: 'T-02', item: 'Pad Kra Pao', total: '฿160', status: 'Cooking' },
  { id: '#1043', table: 'T-05', item: 'Iced Tea x2', total: '฿120', status: 'Ready' },
  { id: '#1044', table: 'T-07', item: 'Tom Yum Soup', total: '฿220', status: 'Pending' },
];

const tableStatus = [
  { name: 'T-01', status: 'Available', variant: 'default' as const },
  { name: 'T-02', status: 'Occupied', variant: 'secondary' as const },
  { name: 'T-03', status: 'Cleaning', variant: 'outline' as const },
  { name: 'T-04', status: 'Available', variant: 'default' as const },
];

export default function DashboardPage() {
  const { username, logout } = useAuth();

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <StaffSidebar />

        <section className="flex-1 p-4 md:p-6">
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardDescription>Dashboard</CardDescription>
                  <CardTitle className="mt-2 text-2xl md:text-3xl">Operations Overview</CardTitle>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs">
                    {username ?? 'Staff'}
                  </span>
                  <Button variant="outline">Export</Button>
                  <Button onClick={logout}>
                    <Link to="/login">Logout</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <SummaryCards cards={summaryCards} />

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <RecentOrdersTable orders={recentOrders} />
            <TableStatus tables={tableStatus} />
          </div>
        </section>
      </div>
    </main>
  );
}
