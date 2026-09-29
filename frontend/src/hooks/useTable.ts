import { useCallback, useEffect, useState } from 'react';
import { canTransitionTableStatus, type TableStatus } from '../features/tables';
import { type ManagedTable } from '@/components/tables';

export function useTable(initialTable: ManagedTable | null) {
  const [table, setTable] = useState<ManagedTable | null>(initialTable);

  useEffect(() => {
    setTable(initialTable);
  }, [initialTable]);

  const canTransition = useCallback(
    (nextStatus: TableStatus) => Boolean(table && canTransitionTableStatus(table.status, nextStatus)),
    [table],
  );

  const transitionTo = useCallback(
    (nextStatus: TableStatus) => {
      if (!table) return false;
      if (!canTransitionTableStatus(table.status, nextStatus)) {
        return false;
      }

      setTable((current) => (current ? { ...current, status: nextStatus } : current));
      return true;
    },
    [table],
  );

  return { table, setTable, canTransition, transitionTo };
}
