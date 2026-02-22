import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, FileText, TrendingUp, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Download } from 'lucide-react';
import Layout from './Layout';
import API_BASE_URL from '../config';

const CustomerSummaryPage = () => {
    const { mobileNumber } = useParams();
    const decodedMobile = decodeURIComponent(mobileNumber);

    const [customerInvoices, setCustomerInvoices] = useState([]);
    const [paginatedInvoices, setPaginatedInvoices] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ sales: 0, paid: 0, pending: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchCustomerInvoices = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/invoice`);
                const filtered = res.data.filter(inv =>
                    String(inv.mobileNumber || '').trim() === String(decodedMobile || '').trim()
                );
                const sales = filtered.reduce((s, inv) => s + inv.totalAmount, 0);
                const paid = filtered.reduce((s, inv) => s + inv.paidAmount, 0);
                const pending = filtered.reduce((s, inv) => s + inv.leftAmount, 0);
                setStats({ sales, paid, pending });
                setCustomerInvoices(filtered);
                if (filtered.length > 0) setCustomerName(filtered[0].customerName);
            } catch (err) {
                console.error('Failed to fetch invoices', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomerInvoices();
    }, [decodedMobile]);

    useEffect(() => {
        const start = (currentPage - 1) * itemsPerPage;
        setPaginatedInvoices(customerInvoices.slice(start, start + itemsPerPage));
    }, [customerInvoices, currentPage]);

    const totalPages = Math.ceil(customerInvoices.length / itemsPerPage);

    const getStatus = (inv) => {
        if (inv.leftAmount <= 0) return { label: 'Paid', cls: 'badge-paid', dot: 'bg-emerald-500' };
        if (inv.paidAmount > 0) return { label: 'Partial', cls: 'badge-partial', dot: 'bg-amber-500' };
        return { label: 'Unpaid', cls: 'badge-due', dot: 'bg-red-500' };
    };

    const pctPaid = stats.sales > 0 ? Math.round((stats.paid / stats.sales) * 100) : 0;

    const headerRight = (
        <button className="btn-secondary text-sm flex items-center gap-2">
            <Download size={15} /> Export
        </button>
    );

    return (
        <Layout
            pageTitle={customerName || 'Customer Account'}
            pageSubtitle={`+91 ${decodedMobile}`}
            headerRight={headerRight}
        >
            <div className="mb-5">
                <Link to="/customers" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
                    <ArrowLeft size={14} /> Back to Customers
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 stagger-children">
                {/* Sales */}
                <div className="card p-6 border-t-[3px] border-t-indigo-500 animate-fade-in-up" style={{ animationFillMode: 'both' }}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-indigo-500 text-xs font-bold uppercase tracking-wider mb-1">Total Sales</p>
                            <h2 className="text-3xl font-extrabold text-slate-900">
                                ₹{stats.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h2>
                        </div>
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <TrendingUp size={22} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1"><TrendingUp size={12} /> Lifetime value</p>
                </div>

                {/* Paid */}
                <div className="card p-6 border-t-[3px] border-t-emerald-500 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Amount Paid</p>
                            <h2 className="text-3xl font-extrabold text-slate-900">
                                ₹{stats.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h2>
                        </div>
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CheckCircle size={22} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700" style={{ width: `${pctPaid}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">{pctPaid}%</span>
                    </div>
                </div>

                {/* Pending */}
                <div className="card p-6 border-t-[3px] border-t-red-500 animate-fade-in-up" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-red-500 text-xs font-bold uppercase tracking-wider mb-1">Pending / Due</p>
                            <h2 className="text-3xl font-extrabold text-slate-900">
                                ₹{stats.pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h2>
                        </div>
                        <div className="p-2.5 bg-red-50 text-red-500 rounded-xl">
                            <AlertCircle size={22} />
                        </div>
                    </div>
                    {stats.pending > 0
                        ? <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 text-xs font-semibold px-2 py-0.5 rounded-lg border border-red-100">Action Required</span>
                        : <span className="text-xs text-slate-400">All cleared ✓</span>
                    }
                </div>
            </div>

            {/* Invoice History */}
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Invoice History</h3>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                        {customerInvoices.length} total
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full data-table text-left">
                        <thead>
                            <tr>
                                <th>Invoice No</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th className="text-right">Total</th>
                                <th className="text-right">Paid</th>
                                <th className="text-right text-red-500">Due</th>
                                <th className="text-center">View</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading...</td></tr>
                            ) : paginatedInvoices.length > 0 ? paginatedInvoices.map(inv => {
                                const s = getStatus(inv);
                                return (
                                    <tr key={inv._id}>
                                        <td className="font-bold text-indigo-600 text-sm">#{inv.invoiceNo}</td>
                                        <td className="text-sm text-slate-500">
                                            {new Date(inv.purchaseDate || inv.createdAt).toLocaleDateString('en-GB')}
                                        </td>
                                        <td>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${s.cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
                                            </span>
                                        </td>
                                        <td className="text-right font-bold text-slate-800 text-sm">
                                            ₹{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-right font-semibold text-emerald-600 text-sm">
                                            ₹{inv.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`text-right font-bold text-sm ${inv.leftAmount > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                                            ₹{inv.leftAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-center">
                                            <Link
                                                to={`/payment/${inv._id}`}
                                                className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-500 flex items-center justify-center mx-auto transition-colors"
                                                title="View Invoice"
                                            >
                                                <ChevronRight size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <FileText size={40} className="mx-auto mb-2 text-slate-200" />
                                        <p className="text-slate-400 text-sm">No invoices for this customer</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {customerInvoices.length > itemsPerPage && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            ><ChevronLeft size={14} /></button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            ><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CustomerSummaryPage;
