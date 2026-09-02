import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import AuthRoutes from './AuthRoutes';
import StaffRoutes from './StaffRoutes';
import DashboardPage from '../pages/DashboardPage';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import ProductsPage from '../pages/ProductsPage';
import TablesPage from '../pages/TablesPage';
import OrderingPage from '../pages/OrderingPage';
import OrderStatusPage from '../pages/OrderStatusPage';
import CheckoutPage from '../pages/CheckoutPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthRoutes />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/order/:sessionToken" element={<OrderingPage />} />
        <Route path="/order/:sessionToken/status" element={<OrderStatusPage />} />
        <Route path="/order/:sessionToken/checkout" element={<CheckoutPage />} />
        {/* <Route path="/qr-order/" element={<QrOrderPage />} /> */}
      </Route>
      <Route element={<StaffRoutes />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/tables" element={<TablesPage />} />
      </Route>
    </Routes>
  );
}
