import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { Shell } from "./Shell";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { RestaurantsPage } from "./pages/RestaurantsPage";
import { MenuPage } from "./pages/MenuPage";
import { OrdersPage } from "./pages/OrdersPage";
import { UsersPage } from "./pages/UsersPage";

function Private() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="login-page muted">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Shell />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route element={<Private />}>
          <Route index element={<OverviewPage />} />
          <Route path="restaurants" element={<RestaurantsPage />} />
          <Route path="restaurants/:id/menu" element={<MenuPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

function LoginGate() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="login-page muted">Đang tải...</div>;
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}
