import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Download, TrendingUp, CheckCircle, Clock, Search, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
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
                setTransactions(invoicesRes.data);
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    if (loading) return <div className="text-center p-10">Loading summary...</div>;
    if (!summary) return <div className="text-center p-10 text-red-500">Failed to load data.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <Link
                            to="/customers"
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-2 text-sm font-medium"
                        >
                            <ArrowLeft size={16} /> Back to Customer List
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Payment Summary</h1>
                        <p className="text-gray-500 mt-1">Overview of financial status across all customers.</p>
                    </div>
                    <div>
                        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm">
                            <Download size={18} /> Export Report
                        </button>
                    </div>
                </div>

                {/* Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Sales Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">GRAND TOTAL SALES</p>
                                <h2 className="text-3xl font-bold text-gray-900">₹{summary.totalSales.toFixed(2)}</h2>
                            </div>
                            <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600 font-medium flex items-center gap-1">
                                ↑ 12%
                            </span>
                            <span className="text-gray-400">vs last month</span>
                        </div>
                    </div>

                    {/* Paid Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-green-600 text-xs font-bold uppercase tracking-wider mb-1">GRAND TOTAL PAID</p>
                                <h2 className="text-3xl font-bold text-gray-900">₹{summary.totalPaid.toFixed(2)}</h2>
                            </div>
                            <div className="bg-green-50 p-2 rounded-full text-green-600">
                                <CheckCircle size={20} />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                                Fully Settled
                            </span>
                            <span className="text-gray-400">100% Collection Rate</span>
                        </div>
                    </div>

                    {/* Pending Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-1">GRAND TOTAL PENDING</p>
                                <h2 className="text-3xl font-bold text-gray-900">₹{summary.totalPending.toFixed(2)}</h2>
                            </div>
                            <div className="bg-red-50 p-2 rounded-full text-red-600">
                                <Clock size={20} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            {summary.totalPending === 0 ? (
                                <span className="text-gray-400 flex items-center gap-1">
                                    <CheckCircle size={14} className="text-gray-300" /> No outstanding dues
                                </span>
                            ) : (
                                <span className="text-red-500 font-medium">
                                    Action Required
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">Recent Transactions Breakdown</h3>
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-800">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Transaction Date</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.slice(0, 10).map((txn) => (
                                    <tr key={txn._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 text-gray-500 font-medium">
                                            {formatDate(txn.date)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 font-medium">
                                            <div className="flex flex-col">
                                                <span>Invoice #{txn.invoiceNo}</span>
                                                <span className="text-xs text-gray-400 font-normal">{txn.customerName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${txn.leftAmount <= 0
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {txn.leftAmount <= 0 ? 'Completed' : 'Processed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-medium text-gray-700">
                                            ₹{txn.paidAmount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-400">
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllInvoicesSummaryPage;
