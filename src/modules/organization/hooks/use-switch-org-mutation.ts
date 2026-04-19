import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSwitchOrgMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgId: string) => {
      localStorage.setItem('currentOrgId', orgId);
      // Opcional: pode chamar um endpoint para persistir a troca no backend
      return orgId;
    },
    onSuccess: () => {
      // Invalida o cache do currentOrg para forçar refetch
      queryClient.invalidateQueries({ queryKey: ['currentOrg'] });
    },
  });
}
