import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Download, TrendingUp, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import API_BASE_URL from '../config';

const AllInvoicesSummaryPage = () => {
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, invoicesRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/invoice/all-summary`),
                    axios.get(`${API_BASE_URL}/invoice`)
                ]);
                setSummary(summaryRes.data);
                setTransactions(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
            } catch (err) {
                console.error('Failed to fetch data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fmt = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const collectionRate = summary && summary.totalSales > 0
        ? Math.round((summary.totalPaid / summary.totalSales) * 100)
        : 0;

    const headerRight = (
        <button className="btn-secondary text-sm flex items-center gap-2">
            <Download size={15} /> Export Report
        </button>
    );

    if (loading) {
        return (
            <Layout pageTitle="Payment Summary" pageSubtitle="Financial overview across all customers" headerRight={headerRight}>
                <div className="card p-8 text-center text-slate-400 animate-pulse">Loading summary...</div>
            </Layout>
        );
    }

    if (!summary) {
        return (
            <Layout pageTitle="Payment Summary" headerRight={headerRight}>
                <div className="card p-8 text-center text-red-500">Failed to load data.</div>
            </Layout>
        );
    }

    return (
        <Layout pageTitle="Payment Summary" pageSubtitle="Financial overview across all customers" headerRight={headerRight}>
            <div className="mb-4">
                <Link to="/customers" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
                    <ArrowLeft size={14} /> Back to Customers
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 stagger-children">
                {/* Sales */}
                <div className="card p-6 border-t-[3px] border-t-indigo-500 animate-fade-in-up" style={{ animationFillMode: 'both' }}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-indigo-500 text-xs font-bold uppercase tracking-wider mb-1">Grand Total Sales</p>
                            <h2 className="text-3xl font-extrabold text-slate-900">₹{summary.totalSales.toFixed(2)}</h2>
                        </div>
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={22} /></div>
                    </div>
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">↑ 12% vs last month</p>
                </div>

                {/* Paid */}
                <div className="card p-6 border-t-[3px] border-t-emerald-500 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Total Paid</p>
                            <h2 className="text-3xl font-extrabold text-slate-900">₹{summary.totalPaid.toFixed(2)}</h2>
                        </div>
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={22} /></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${collectionRate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">{collectionRate}%</span>
                    </div>
                </div>

                {/* Pending */}
                <div className="card p-6 border-t-[3px] border-t-red-500 animate-fade-in-up" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-red-500 text-xs font-bold uppercase tracking-wider mb-1">Total Pending</p>
                            <h2 className="text-3xl font-extrabold text-slate-900">₹{summary.totalPending.toFixed(2)}</h2>
                        </div>
                        <div className="p-2.5 bg-red-50 text-red-500 rounded-xl"><Clock size={22} /></div>
                    </div>
                    {summary.totalPending === 0
                        ? <span className="text-xs text-slate-400">No outstanding dues ✓</span>
                        : <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 text-xs font-semibold px-2 py-0.5 rounded-lg border border-red-100">Action Required</span>
                    }
                </div>
            </div>

            {/* Transactions */}
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Recent Transactions</h3>
                    <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
                        {transactions.length} total
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full data-table text-left">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Invoice / Customer</th>
                                <th>Status</th>
                                <th className="text-right">Paid Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.slice(0, 15).map(txn => (
                                <tr key={txn._id}>
                                    <td className="text-sm text-slate-500">{fmt(txn.date || txn.purchaseDate || txn.createdAt)}</td>
                                    <td>
                                        <p className="text-sm font-semibold text-slate-800">Invoice #{txn.invoiceNo}</p>
                                        <p className="text-xs text-slate-400">{txn.customerName}</p>
                                    </td>
                                    <td>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${txn.leftAmount <= 0 ? 'badge-paid' : 'badge-partial'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${txn.leftAmount <= 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            {txn.leftAmount <= 0 ? 'Completed' : 'Partial'}
                                        </span>
                                    </td>
                                    <td className="text-right font-bold text-slate-800 text-sm font-mono">
                                        ₹{Number(txn.paidAmount).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr><td colSpan={4} className="py-12 text-center text-slate-400 text-sm">No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default AllInvoicesSummaryPage;
