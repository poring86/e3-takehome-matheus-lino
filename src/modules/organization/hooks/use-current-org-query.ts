import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useCurrentOrgQuery() {
	// Busca o currentOrgId do localStorage
	const currentOrgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrgId') : null;
	const queryClient = useQueryClient();

	// Busca os dados da organização atual
	const query = useQuery({
		queryKey: ['currentOrg', currentOrgId],
		queryFn: async () => {
			if (!currentOrgId) return null;
			const res = await fetch(`/api/organizations/${currentOrgId}`);
			if (!res.ok) throw new Error('Failed to load organization');
			return await res.json();
		},
		enabled: !!currentOrgId,
		staleTime: 30_000,
	});

	// Helper para forçar refetch
	const refetchCurrentOrg = () => queryClient.invalidateQueries({ queryKey: ['currentOrg'] });

	return {
		currentOrg: query.data,
		loading: query.isLoading || query.isFetching,
		error: query.error,
		refetchCurrentOrg,
	};
}
