import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const ProductsPage = lazy(() => import('../pages/ProductsPage'));
const TablesPage = lazy(() => import('../pages/TablesPage'));
const OrderingPage = lazy(() => import('../pages/OrderingPage'));
const OrderStatusPage = lazy(() => import('../pages/OrderStatusPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const IncomingOrdersPage = lazy(() => import('../pages/IncommingOrdersPage'));

export default function AppRouter() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/tables" element={<TablesPage />} />
        <Route path="/order/:sessionToken" element={<OrderingPage />} />
        <Route path="/order/:sessionToken/status" element={<OrderStatusPage />} />
        <Route path="/order/:sessionToken/checkout" element={<CheckoutPage />} />
        <Route path="/incoming-orders" element={<IncomingOrdersPage />} />
      </Routes>
    </Suspense>
  );
}