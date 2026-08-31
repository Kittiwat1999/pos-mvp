export const TABLE_STATUSES = ['AVAILABLE', 'OCCUPIED', 'CLEANING'] as const;

export type TableStatus = (typeof TABLE_STATUSES)[number];

const transitions: Record<TableStatus, TableStatus[]> = {
  AVAILABLE: ['OCCUPIED'],
  OCCUPIED: ['CLEANING'],
  CLEANING: ['AVAILABLE'],
};

export function canTransitionTableStatus(from: TableStatus, to: TableStatus): boolean {
  return transitions[from].includes(to);
}
