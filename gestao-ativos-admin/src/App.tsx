import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Devices } from './pages/Devices';
import { Pending } from './pages/Pending';
import { Settings } from './pages/Settings';
import { DeviceDetail } from './pages/DeviceDetail';
import { RegisterDevice } from './pages/RegisterDevice';
import { Plans } from './pages/Plans';
import { Privacy } from './pages/Privacy';
import { Alerts } from './pages/Alerts';
import { Reports } from './pages/Reports';
import { GeoIP } from './pages/GeoIP';
import { ApiAccess } from './pages/ApiAccess';
import Webhooks from './pages/Webhooks';
import SSO from './pages/SSO';
import ShadowIT from './pages/ShadowIT';
import AuditLogs from './pages/AuditLogs';
import Branding from './pages/Branding';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="devices" element={<Devices />} />
            <Route path="devices/:id" element={<DeviceDetail />} />
            <Route path="register" element={<RegisterDevice />} />
            <Route path="pending" element={<Pending />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="geoip" element={<GeoIP />} />
            <Route path="api" element={<ApiAccess />} />
            <Route path="webhooks" element={<Webhooks />} />
            <Route path="sso" element={<SSO />} />
            <Route path="shadow-it" element={<ShadowIT />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="branding" element={<Branding />} />
            <Route path="plans" element={<Plans />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
