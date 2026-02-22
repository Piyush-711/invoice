import React from 'react';
import { Routes, Route } from 'react-router-dom';
import InvoicePage from './components/InvoicePage';
import PaymentPage from './components/PaymentPage';
import CustomerListPage from './components/CustomerListPage';
import CustomerSummaryPage from './components/CustomerSummaryPage';
import AllInvoicesSummaryPage from './components/AllInvoicesSummaryPage';
import AddProductPage from './components/AddProductPage';
import DashboardPage from './components/DashboardPage';
import LowStockAlertsPage from './components/LowStockAlertsPage';

// Each page manages its own Layout wrapper.
// InvoicePage and PaymentPage are full-screen (no sidebar) for print compatibility.
function App() {
    return (
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/customer-summary/:mobileNumber" element={<CustomerSummaryPage />} />
            <Route path="/summary" element={<AllInvoicesSummaryPage />} />
            <Route path="/add-product" element={<AddProductPage />} />
            <Route path="/low-stock" element={<LowStockAlertsPage />} />
            <Route path="/invoices" element={<InvoicePage />} />
            <Route path="/payment/:id" element={<PaymentPage />} />
        </Routes>
    );
}

export default App;
