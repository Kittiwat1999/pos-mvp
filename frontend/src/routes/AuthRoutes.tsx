import { Outlet } from 'react-router-dom';

/** Layout boundary for routes that do not require an authenticated session. */
export default function AuthRoutes() {
  return <Outlet />;
}
