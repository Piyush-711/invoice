import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save } from 'lucide-react';

import PaymentSummaryCard from './PaymentSummaryCard';

const PaymentPage = () => {
    // ... existing state ...
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [paidAmountInput, setPaidAmountInput] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ... existing fetch logic ...
        const fetchInvoice = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/invoice/${id}`);
                setInvoice(res.data);
                setPaidAmountInput(res.data.paidAmount || 0);
            } catch (err) {
                console.error("Failed to fetch invoice");
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    const handleUpdatePayment = async () => {
        // ... existing update logic ...
        try {
            const res = await axios.put(`http://localhost:5000/invoice/${id}/payment`, {
                paidAmount: paidAmountInput
            });
            setInvoice(res.data);
            alert("Payment updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to update payment");
        }
    };

    if (loading) return <div className="text-center p-10">Loading...</div>;
    if (!invoice) return <div className="text-center p-10">Invoice not found</div>;

    const leftAmount = invoice.totalAmount - Number(paidAmountInput);

    return (
        <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
            <div className="w-full max-w-2xl">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-gray-600 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors shadow-md mb-6"
                >
                    <ArrowLeft size={20} /> Back to Invoice
                </Link>

                {/* New Customer-level Summary */}
                <PaymentSummaryCard mobileNumber={invoice.mobileNumber} customerName={invoice.customerName} />

                {/* Existing Invoice-level Details */}
                <div className="bg-white p-8 rounded-xl shadow-2xl">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Current Invoice Payment</h2>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Customer Name:</span>
                            <span className="font-semibold text-gray-800">{invoice.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Mobile Number:</span>
                            <span className="font-semibold text-gray-800">{invoice.mobileNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Purchase Date:</span>
                            <span className="font-semibold text-gray-800">{new Date(invoice.purchaseDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Invoice Total:</span>
                            <span className="font-bold text-lg text-blue-900">₹{invoice.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="bg-gray-100 p-6 rounded-lg mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enter Paid Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input
                                type="number"
                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg font-semibold"
                                value={paidAmountInput}
                                onChange={(e) => setPaidAmountInput(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4 mb-8">
                        <div className="flex justify-between items-center text-xl">
                            <span className="font-bold text-gray-700">Left Amount:</span>
                            <span className={`font-extrabold text-2xl ${leftAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{leftAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleUpdatePayment}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 shadow-lg"
                    >
                        <Save size={20} /> Update Payment Record
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
