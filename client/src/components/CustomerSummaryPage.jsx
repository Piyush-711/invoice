import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PaymentSummaryCard from './PaymentSummaryCard';

const CustomerSummaryPage = () => {
    const { mobileNumber } = useParams();
    const decodedMobile = decodeURIComponent(mobileNumber);

    const [customerInvoices, setCustomerInvoices] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomerInvoices = async () => {
            try {
                const res = await axios.get('http://localhost:5000/invoice');

                const filtered = res.data.filter(inv => {
                    const invMobile = String(inv.mobileNumber || '').trim();
                    const paramMobile = String(decodedMobile || '').trim();
                    return invMobile === paramMobile;
                });

                setCustomerInvoices(filtered);
                if (filtered.length > 0) {
                    setCustomerName(filtered[0].customerName);
                } else {
                    console.warn("No invoices found matching mobile:", decodedMobile);
                }
            } catch (err) {
                console.error("Failed to fetch invoices", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomerInvoices();
    }, [decodedMobile]);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <Link
                    to="/customers"
                    className="inline-flex items-center gap-2 bg-gray-600 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors shadow-md mb-6"
                >
                    <ArrowLeft size={20} /> Back to Customer List
                </Link>

                <div className="flex justify-between items-end mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Customer Account: <span className="text-blue-600">{customerName || decodedMobile}</span>
                    </h1>
                </div>

                {/* The Stats Section */}
                <PaymentSummaryCard mobileNumber={decodedMobile} />

                {/* List of Invoices for this customer */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mt-8">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800">Invoice History</h2>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Invoice No</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-right">Paid</th>
                                <th className="p-4 text-right">Left</th>
                                <th className="p-4 text-center">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {customerInvoices.length > 0 ? (
                                customerInvoices.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-bold text-gray-800">#{inv.invoiceNo}</td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(inv.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right font-semibold">₹{inv.totalAmount.toFixed(2)}</td>
                                        <td className="p-4 text-right text-green-600">₹{inv.paidAmount.toFixed(2)}</td>
                                        <td className={`p-4 text-right font-bold ${inv.leftAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                            ₹{inv.leftAmount.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <Link
                                                to={`/payment/${inv._id}`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                                            >
                                                <ArrowRight size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        {loading ? "Loading history..." : "No invoices found for this customer."}
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

export default CustomerSummaryPage;
