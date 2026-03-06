import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    const stored = localStorage.getItem('casa_auth');
    if (!stored) throw redirect({ to: '/' });
    try {
      const { expiry } = JSON.parse(stored);
      if (Date.now() >= expiry) {
        localStorage.removeItem('casa_auth');
        throw redirect({ to: '/' });
      }
    } catch (e) {
      if (e instanceof Response || (e && typeof e === 'object' && 'to' in e)) throw e;
      localStorage.removeItem('casa_auth');
      throw redirect({ to: '/' });
    }
  },
  component: () => <Outlet />,
});
