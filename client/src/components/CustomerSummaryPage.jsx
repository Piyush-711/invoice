import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight, FileText, TrendingUp, CheckCircle, AlertCircle, Eye, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import API_BASE_URL from '../config';

const CustomerSummaryPage = () => {
    const { mobileNumber } = useParams();
    const decodedMobile = decodeURIComponent(mobileNumber);

    const [customerInvoices, setCustomerInvoices] = useState([]);
    const [paginatedInvoices, setPaginatedInvoices] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(true);

    // Summary Stats
    const [stats, setStats] = useState({ sales: 0, paid: 0, pending: 0 });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchCustomerInvoices = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/invoice`);

                const filtered = res.data.filter(inv => {
                    const invMobile = String(inv.mobileNumber || '').trim();
                    const paramMobile = String(decodedMobile || '').trim();
                    return invMobile === paramMobile;
                });

                // Calculate stats
                const sales = filtered.reduce((sum, inv) => sum + inv.totalAmount, 0);
                const paid = filtered.reduce((sum, inv) => sum + inv.paidAmount, 0);
                const pending = filtered.reduce((sum, inv) => sum + inv.leftAmount, 0);

                setStats({ sales, paid, pending });
                setCustomerInvoices(filtered);

                if (filtered.length > 0) {
                    setCustomerName(filtered[0].customerName);
                }
            } catch (err) {
                console.error("Failed to fetch invoices", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomerInvoices();
    }, [decodedMobile]);

    // Handle Pagination
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedInvoices(customerInvoices.slice(startIndex, endIndex));
    }, [customerInvoices, currentPage]);

    const totalPages = Math.ceil(customerInvoices.length / itemsPerPage);

    const getStatus = (inv) => {
        if (inv.leftAmount <= 0) return { label: 'Paid', class: 'bg-green-100 text-green-700' };
        if (inv.paidAmount > 0) return { label: 'Partial', class: 'bg-orange-100 text-orange-700' };
        return { label: 'Unpaid', class: 'bg-red-100 text-red-700' };
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Back Link */}
                <Link
                    to="/customers"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft size={16} /> Back to Customer List
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            Customer Account: <span className="text-[#0284c7]">{customerName || decodedMobile}</span>
                        </h1>
                        <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
                            <span className="flex items-center gap-1">
                                📞 +91 {decodedMobile}
                            </span>
                            <span className="hidden md:inline text-gray-300">|</span>
                            <span className="flex items-center gap-1">
                                📍 New Delhi, India
                            </span>
                        </div>
                    </div>
                    <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm flex items-center gap-2">
                        <FileText size={18} className="text-red-500" /> Download Statement
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Sales */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[#0284c7] text-xs font-bold uppercase tracking-wider mb-2">TOTAL SALES AMOUNT</p>
                                <h2 className="text-4xl font-bold text-gray-900 mb-2">₹{stats.sales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium">
                                    <TrendingUp size={12} /> Lifetime value
                                </span>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-xl">
                                <TrendingUp size={24} className="text-[#0284c7]" />
                            </div>
                        </div>
                    </div>

                    {/* Paid */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-50 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[#10b981] text-xs font-bold uppercase tracking-wider mb-2">TOTAL PAID AMOUNT</p>
                                <h2 className="text-4xl font-bold text-gray-900 mb-2">₹{stats.paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                <div className="h-1 w-12 bg-[#10b981] rounded-full mt-2"></div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-full">
                                <CheckCircle size={28} className="text-[#10b981]" />
                            </div>
                        </div>
                        <div className="absolute bottom-6 right-6 text-xs text-gray-400">
                            {stats.sales > 0 ? Math.round((stats.paid / stats.sales) * 100) : 0}% of total sales
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[#ef4444] text-xs font-bold uppercase tracking-wider mb-2">TOTAL PENDING / LEFT</p>
                                <h2 className="text-4xl font-bold text-gray-900 mb-2">₹{stats.pending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                <span className="inline-flex items-center gap-1 bg-red-50 text-[#ef4444] px-2 py-0.5 rounded text-xs font-medium mt-1">
                                    High Balance
                                </span>
                            </div>
                            <div className="bg-red-50 p-3 rounded-full">
                                <AlertCircle size={28} className="text-[#ef4444]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invoice History Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">Invoice History</h3>
                        <button className="flex items-center gap-2 text-gray-500 text-sm font-medium hover:text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <Filter size={14} /> All Invoices
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Invoice No</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Total Amount</th>
                                    <th className="px-6 py-4 text-right">Paid Amount</th>
                                    <th className="px-6 py-4 text-right">Left Amount</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-gray-400">Loading invoices...</td></tr>
                                ) : paginatedInvoices.length > 0 ? (
                                    paginatedInvoices.map((inv) => {
                                        const status = getStatus(inv);
                                        return (
                                            <tr key={inv._id} className="hover:bg-gray-50/50 transition duration-150">
                                                <td className="px-6 py-4 font-bold text-gray-700 text-sm">#{inv.invoiceNo}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(inv.purchaseDate || inv.createdAt).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${status.class.replace('bg-', 'border-').replace('text-', 'text-opacity-80 ')} bg-opacity-50 min-w-[70px]`}>
                                                        {inv.leftAmount <= 0 ? (
                                                            <div className="flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Paid
                                                            </div>
                                                        ) : inv.paidAmount > 0 ? (
                                                            <div className="flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Partial
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Unpaid
                                                            </div>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-800 text-sm">₹{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-4 text-right font-medium text-[#10b981] text-sm">₹{inv.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                <td className={`px-6 py-4 text-right font-bold text-sm ${inv.leftAmount > 0 ? 'text-[#ef4444]' : 'text-gray-300'}`}>
                                                    ₹{inv.leftAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            to={`/payment/${inv._id}`}
                                                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#0284c7] hover:border-[#0284c7] transition bg-white"
                                                            title="Update Payment"
                                                        >
                                                            <ArrowRight size={14} />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <FileText size={48} className="mb-2 opacity-20" />
                                                <p>No invoices found for this customer.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {customerInvoices.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                            <p className="text-sm text-gray-500">
                                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, customerInvoices.length)}</span> of <span className="font-medium">{customerInvoices.length}</span> invoices
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerSummaryPage;
