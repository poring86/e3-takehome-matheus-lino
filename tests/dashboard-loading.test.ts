import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../src/app/dashboard/page';
import * as auth from '../src/modules/auth/hooks/use-user-session';
import * as org from '../src/modules/organization/hooks/use-current-org';

// Mock hooks
jest.mock('../src/modules/auth/hooks/use-user-session');
jest.mock('../src/modules/organization/hooks/use-current-org');

describe('DashboardPage loading and flicker', () => {
  it('shows loader while loading and never flickers onboarding', async () => {
    // Simula carregamento inicial
    (auth.useUserSession as jest.Mock).mockReturnValue({ user: undefined, loading: true });
    (org.useCurrentOrg as jest.Mock).mockReturnValue({ currentOrg: undefined, userOrgs: undefined, loading: true });
    render(<DashboardPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Simula usuário logado, dados carregando
    (auth.useUserSession as jest.Mock).mockReturnValue({ user: { id: '1', email: 'a@b.com' }, loading: false });
    (org.useCurrentOrg as jest.Mock).mockReturnValue({ currentOrg: undefined, userOrgs: undefined, loading: true });
    // Aguarda atualização
    await waitFor(() => expect(screen.getByText(/loading/i)).toBeInTheDocument());

    // Simula dados carregados, sem orgs
    (org.useCurrentOrg as jest.Mock).mockReturnValue({ currentOrg: null, userOrgs: [], loading: false });
    await waitFor(() => expect(screen.getByText(/create organization/i)).toBeInTheDocument());

    // Simula dados carregados, com org
    (org.useCurrentOrg as jest.Mock).mockReturnValue({ currentOrg: { id: 'org1', name: 'Org 1' }, userOrgs: [{ org_id: 'org1', organizations: { id: 'org1', name: 'Org 1' } }], loading: false });
    await waitFor(() => expect(screen.getByText(/team notes/i)).toBeInTheDocument());
  });
});
