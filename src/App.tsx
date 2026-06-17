import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import OrderPage from "@/pages/OrderPage";
import QueuePage from "@/pages/QueuePage";
import CallPage from "@/pages/CallPage";
import CutRecordsPage from "@/pages/CutRecordsPage";
import QuotaPage from "@/pages/QuotaPage";
import QuotaAdminPage from "@/pages/QuotaAdminPage";
import ConsumptionPage from "@/pages/ConsumptionPage";
import SettlementPage from "@/pages/SettlementPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/call" element={<CallPage />} />
          <Route path="/cut/records" element={<CutRecordsPage />} />
          <Route path="/quota" element={<QuotaPage />} />
          <Route path="/quota/admin" element={<QuotaAdminPage />} />
          <Route path="/consumption" element={<ConsumptionPage />} />
          <Route path="/settlement" element={<SettlementPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
