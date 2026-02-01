import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, History, Wand2, FileText } from 'lucide-react';
import API_BASE_URL from '../config';

const CustomerListPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All Status');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/invoice`);
                setInvoices(res.data);
            } catch (err) {
                console.error("Failed to fetch invoices", err);
                alert("Failed to load invoices. Please ensure the backend server is running and you have restarted it after the latest changes.");
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/invoice/${id}`);
            // Remove from state
            setInvoices(prev => prev.filter(inv => inv._id !== id));
        } catch (err) {
            console.error("Failed to delete invoice", err);
            alert("Failed to delete invoice.");
        }
    };

    const getStatus = (invoice) => {
        return invoice.leftAmount <= 0 ? 'Paid' : 'Due';
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.invoiceNo.toString().includes(searchTerm) ||
            inv.mobileNumber.includes(searchTerm);

        const status = getStatus(inv);
        const matchesStatus = filterStatus === 'All Status' || status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return <div className="text-center p-10">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
                        <p className="text-gray-500 mt-1">Manage customer invoices and payment status.</p>
                    </div>
                    <div>
                        <div className="flex gap-3">
                            <Link
                                to="/summary"
                                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                <FileText size={20} /> Total Payment
                            </Link>
                            <Link
                                to="/"
                                className="flex items-center gap-2 bg-[#0f172a] text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition font-medium"
                            >
                                <Plus size={20} /> Create Invoice
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center border border-gray-100">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, invoice #..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <select
                            className="appearance-none bg-white border border-gray-200 px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 cursor-pointer"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option>All Status</option>
                            <option>Paid</option>
                            <option>Due</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">

                    <div className="table-container overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-semibold text-gray-500 tracking-wider">
                                    <th className="px-6 py-4">Invoice #</th>
                                    <th className="px-6 py-4">Customer Name</th>
                                    <th className="px-6 py-4">Mobile Number</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount Paid</th>
                                    <th className="px-6 py-4 text-right">Amount Due</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {currentItems.map((inv) => {
                                    const status = getStatus(inv);
                                    const isPaid = status === 'Paid';

                                    return (
                                        <tr key={inv._id} className="hover:bg-gray-50 transition group">
                                            <td className="px-6 py-4 text-gray-500 font-medium">
                                                INV-2023-{inv.invoiceNo.toString().padStart(4, '0')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                                                        {inv.customerName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{inv.customerName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-medium font-mono text-sm tracking-wide">
                                                {inv.mobileNumber}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isPaid
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-700">
                                                ₹{inv.paidAmount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-red-600">
                                                {inv.leftAmount > 0 ? `₹${inv.leftAmount.toFixed(2)}` : '₹0.00'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-3 opacity-100 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        to={`/payment/${inv._id}`}
                                                        title="Manage Payment"
                                                        className="group-hover:scale-110 transition-transform"
                                                    >
                                                        <div className="w-8 h-8 rounded-full border border-green-200 bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs shadow-sm hover:bg-green-100 transition-colors">
                                                            Rs
                                                        </div>
                                                    </Link>
                                                    <Link
                                                        to={`/customer-summary/${encodeURIComponent(inv.mobileNumber)}`}
                                                        title="History"
                                                        className="text-gray-400 hover:text-blue-500 transition"
                                                    >
                                                        <History size={16} />
                                                    </Link>
                                                    <Link
                                                        to={`/payment/${inv._id}`}
                                                        title="Edit"
                                                        className="text-gray-400 hover:text-gray-600 transition"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(inv._id)}
                                                        title="Delete"
                                                        className="text-gray-400 hover:text-red-500 transition"
                                                    >
                                                        <Trash2 size={16} />
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
                    {filteredInvoices.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="bg-gray-50 rounded-full p-4 mb-3">
                                <Search className="text-gray-300" size={24} />
                            </div>
                            <h3 className="text-gray-900 font-medium">No invoices found</h3>
                            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredInvoices.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                            <span className="text-sm text-gray-500">
                                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredInvoices.length)}</span> of <span className="font-medium">{filteredInvoices.length}</span> results
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === Math.ceil(filteredInvoices.length / itemsPerPage)}
                                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="text-center py-6 text-sm text-gray-400">
                    &copy; 2023 Business Manager System. All rights reserved.
                </footer>
            </div>
        </div >
    );
};

export default CustomerListPage;
