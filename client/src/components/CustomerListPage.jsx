import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Edit, FileText, Trash2 } from 'lucide-react';
import API_BASE_URL from '../config';

const CustomerListPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="text-center p-10">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Customer Invoices</h1>
                    <div className="flex gap-4">
                        <Link
                            to="/summary"
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            <FileText size={20} /> Total Payment
                        </Link>
                        <Link
                            to="/"
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            <Plus size={20} /> New Invoice
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Invoice No</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Customer Name</th>
                                <th className="p-4">Mobile</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-right">Paid</th>
                                <th className="p-4 text-right">Left</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoices.map((inv) => (
                                <tr key={inv._id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-bold text-gray-800">#{inv.invoiceNo}</td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {new Date(inv.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-4 font-semibold text-gray-800">{inv.customerName}</td>
                                    <td className="p-4 text-gray-600">{inv.mobileNumber}</td>
                                    <td className="p-4 text-right font-semibold">₹{inv.totalAmount.toFixed(2)}</td>
                                    <td className="p-4 text-right text-green-600">₹{inv.paidAmount.toFixed(2)}</td>
                                    <td className={`p-4 text-right font-bold ${inv.leftAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                        ₹{inv.leftAmount.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link
                                                to={`/customer-summary/${encodeURIComponent(inv.mobileNumber)}`}
                                                title="View Payment Summary"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition"
                                            >
                                                <FileText size={16} />
                                            </Link>
                                            <Link
                                                to={`/payment/${inv._id}`}
                                                title="Edit / View Payment"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                                            >
                                                <Edit size={16} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(inv._id)}
                                                title="Delete Invoice"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-gray-500">
                                        No invoices found. Create one to get started!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerListPage;
