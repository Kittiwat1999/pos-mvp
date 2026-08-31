import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type TableStatusItem = {
  name: string;
  status: string;
  variant: 'default' | 'secondary' | 'outline';
};

export default function TableStatus({ tables }: { tables: TableStatusItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Table status</CardTitle>
          <Button variant="ghost" size="sm">Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tables.map((table) => (
            <div key={table.name} className="flex items-center justify-between">
              <span className="font-medium">{table.name}</span>
              <Badge variant={table.variant}>{table.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
