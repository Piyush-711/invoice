import React from 'react';
import { Routes, Route } from 'react-router-dom';
import InvoicePage from './components/InvoicePage';
import PaymentPage from './components/PaymentPage';
import CustomerListPage from './components/CustomerListPage';
import CustomerSummaryPage from './components/CustomerSummaryPage';
import AllInvoicesSummaryPage from './components/AllInvoicesSummaryPage';
import AddProductPage from './components/AddProductPage';

function App() {
    return (
        <div className="min-h-screen">
            <Routes>
                <Route path="/" element={<InvoicePage />} />
                <Route path="/customers" element={<CustomerListPage />} />
                <Route path="/payment/:id" element={<PaymentPage />} />
                <Route path="/customer-summary/:mobileNumber" element={<CustomerSummaryPage />} />
                <Route path="/summary" element={<AllInvoicesSummaryPage />} />
                <Route path="/add-product" element={<AddProductPage />} />
            </Routes>
        </div>
    );
}

export default App;
