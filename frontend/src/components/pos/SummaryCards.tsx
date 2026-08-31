import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

export type SummaryCard = {
  label: string;
  value: string;
  change: string;
};

export default function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="mt-2 text-sm text-primary">{card.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
