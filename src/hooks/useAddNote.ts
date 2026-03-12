import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getKnownNoteCounts, setKnownNoteCounts } from '@/lib/notifications';
import type { AddNoteRequest } from '@/lib/types';

export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddNoteRequest) => api.addNote(data),
    onSuccess: (_data, variables) => {
      // Bump the known note count so the watcher doesn't notify for our own note
      const counts = getKnownNoteCounts();
      counts[variables.listingId] = (counts[variables.listingId] ?? 0) + 1;
      setKnownNoteCounts(counts);

      queryClient.invalidateQueries({ queryKey: ['listing', variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
