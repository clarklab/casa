import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AddNoteRequest } from '@/lib/types';

export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddNoteRequest) => api.addNote(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listing', variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
