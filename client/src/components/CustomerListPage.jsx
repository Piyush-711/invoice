import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, History, FileText, X, Check } from 'lucide-react';
import Layout from './Layout';
import API_BASE_URL from '../config';

const CustomerListPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [editFormData, setEditFormData] = useState({ customerName: '', mobileNumber: '' });

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/invoice`);
                setInvoices(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Failed to fetch invoices', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this invoice?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/invoice/${id}`);
            setInvoices(prev => prev.filter(inv => inv._id !== id));
        } catch (err) {
            alert('Failed to delete invoice.');
        }
    };

    const getStatus = (inv) => inv.leftAmount <= 0 ? 'Paid' : 'Due';

    const openPaymentModal = (inv) => { setSelectedInvoice(inv); setPaymentAmount(''); setPaymentModalOpen(true); };
    const openEditModal = (inv) => {
        setSelectedInvoice(inv);
        setEditFormData({ customerName: inv.customerName, mobileNumber: inv.mobileNumber });
        setEditModalOpen(true);
    };

    const handleUpdatePayment = async () => {
        if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) < 0) {
            alert('Please enter a valid amount'); return;
        }
        try {
            const newTotalPaid = (Number(selectedInvoice.paidAmount) || 0) + Number(paymentAmount);
            await axios.put(`${API_BASE_URL}/invoice/${selectedInvoice._id}/payment`, { paidAmount: newTotalPaid });
            setInvoices(prev => prev.map(inv => inv._id === selectedInvoice._id
                ? { ...inv, paidAmount: newTotalPaid, leftAmount: inv.totalAmount - newTotalPaid }
                : inv));
            setPaymentModalOpen(false);
        } catch (err) { alert('Failed to update payment'); }
    };

    const handleUpdateInvoice = async () => {
        try {
            const res = await axios.put(`${API_BASE_URL}/invoice/${selectedInvoice._id}`, editFormData);
            setInvoices(prev => prev.map(inv => inv._id === selectedInvoice._id ? { ...inv, ...res.data } : inv));
            setEditModalOpen(false);
        } catch (err) { alert('Failed to update invoice'); }
    };

    const filtered = invoices.filter(inv => {
        const matchSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
            || inv.invoiceNo.toString().includes(searchTerm)
            || inv.mobileNumber.includes(searchTerm);
        const matchStatus = filterStatus === 'All' || getStatus(inv) === filterStatus;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const statusTabs = ['All', 'Paid', 'Due'];

    const avatarGradients = [
        'from-indigo-400 to-indigo-600', 'from-emerald-400 to-emerald-600',
        'from-amber-400 to-amber-600', 'from-purple-400 to-purple-600',
        'from-rose-400 to-rose-600', 'from-cyan-400 to-cyan-600',
    ];

    const headerRight = (
        <Link to="/summary" className="btn-secondary text-sm flex items-center gap-2">
            <FileText size={15} /> Summary
        </Link>
    );

    if (loading) {
        return (
            <Layout pageTitle="Invoice Management" pageSubtitle="Manage customer invoices and payments" headerRight={headerRight}>
                <div className="card p-8 text-center text-slate-400 animate-pulse">Loading invoices...</div>
            </Layout>
        );
    }

    return (
        <Layout pageTitle="Invoice Management" pageSubtitle="Manage customer invoices and payments" headerRight={headerRight}>

            {/* Search + Filter Bar */}
            <div className="card px-5 py-4 mb-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search name, invoice #, mobile..."
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-indigo-400 transition-all"
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                    {statusTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setFilterStatus(tab); setCurrentPage(1); }}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200
                                ${filterStatus === tab
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden mb-4">
                <div className="overflow-x-auto">
                    <table className="w-full data-table text-left">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Customer</th>
                                <th>Mobile</th>
                                <th>Status</th>
                                <th className="text-right">Paid</th>
                                <th className="text-right">Due</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((inv, idx) => {
                                const isPaid = getStatus(inv) === 'Paid';
                                return (
                                    <tr key={inv._id} className="group">
                                        <td className="text-sm font-semibold text-indigo-600">
                                            INV-{inv.invoiceNo.toString().padStart(4, '0')}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarGradients[idx % avatarGradients.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                                    {inv.customerName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-slate-800 text-sm">{inv.customerName}</span>
                                            </div>
                                        </td>
                                        <td className="text-slate-500 font-mono text-xs">{inv.mobileNumber}</td>
                                        <td>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${isPaid ? 'badge-paid' : 'badge-due'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {isPaid ? 'Paid' : 'Due'}
                                            </span>
                                        </td>
                                        <td className="text-right font-semibold text-slate-700 text-sm">₹{Number(inv.paidAmount).toFixed(2)}</td>
                                        <td className="text-right font-bold text-sm text-red-500">
                                            {inv.leftAmount > 0 ? `₹${Number(inv.leftAmount).toFixed(2)}` : <span className="text-slate-300">₹0.00</span>}
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-center gap-1.5">
                                                {/* Pay */}
                                                <button
                                                    onClick={() => openPaymentModal(inv)}
                                                    title="Record Payment"
                                                    className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors font-bold text-xs"
                                                >
                                                    ₹
                                                </button>
                                                {/* History */}
                                                <Link
                                                    to={`/customer-summary/${encodeURIComponent(inv.mobileNumber)}`}
                                                    title="View History"
                                                    className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-500 flex items-center justify-center transition-colors"
                                                >
                                                    <History size={14} />
                                                </Link>
                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEditModal(inv)}
                                                    title="Edit"
                                                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(inv._id)}
                                                    title="Delete"
                                                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <Search size={24} className="text-slate-300" />
                        </div>
                        <h3 className="text-slate-700 font-semibold">No invoices found</h3>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filter.</p>
                    </div>
                )}

                {/* Pagination */}
                {filtered.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span>–<span className="font-semibold text-slate-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-semibold text-slate-700">{filtered.length}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >Previous</button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== Payment Modal ===== */}
            {paymentModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setPaymentModalOpen(false)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden animate-scale-in">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Record Payment</h3>
                                <p className="text-slate-400 text-sm mt-0.5">
                                    INV-{selectedInvoice.invoiceNo.toString().padStart(4, '0')} · {selectedInvoice.customerName}
                                </p>
                            </div>
                            <button onClick={() => setPaymentModalOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Summary Row */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                                    <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-wide mb-1">Total</p>
                                    <p className="text-slate-900 font-bold text-base">₹{Number(selectedInvoice.totalAmount).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wide mb-1">Paid</p>
                                    <p className="text-emerald-700 font-bold text-base">₹{Number(selectedInvoice.paidAmount).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-red-50 rounded-xl p-3 text-center">
                                    <p className="text-red-500 text-[10px] font-bold uppercase tracking-wide mb-1">Due</p>
                                    <p className="text-red-600 font-bold text-base">₹{Number(selectedInvoice.leftAmount).toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Amount Received (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        className="w-full pl-8 pr-16 py-3 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:border-indigo-400 transition-all"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">INR</span>
                                </div>
                                <div className="mt-2 flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Remaining after payment:</span>
                                    <span className="font-bold text-slate-800">
                                        ₹{Math.max(0, Number(selectedInvoice.leftAmount) - (Number(paymentAmount) || 0)).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdatePayment}
                                className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                            >
                                <Check size={16} /> Update Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Edit Modal ===== */}
            {editModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-lg">Edit Invoice</h3>
                            <button onClick={() => setEditModalOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Customer Name</label>
                                <input
                                    type="text"
                                    value={editFormData.customerName}
                                    onChange={e => setEditFormData({ ...editFormData, customerName: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium text-sm focus:border-indigo-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Mobile Number</label>
                                <input
                                    type="text"
                                    value={editFormData.mobileNumber}
                                    onChange={e => setEditFormData({ ...editFormData, mobileNumber: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium text-sm focus:border-indigo-400 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleUpdateInvoice}
                                className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-2"
                            >
                                <Check size={16} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CustomerListPage;
