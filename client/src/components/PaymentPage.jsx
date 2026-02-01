import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save } from 'lucide-react';
import API_BASE_URL from '../config';

import PaymentSummaryCard from './PaymentSummaryCard';

const PaymentPage = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [paidAmountInput, setPaidAmountInput] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/invoice/${id}`);
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
        try {
            const res = await axios.put(`${API_BASE_URL}/invoice/${id}/payment`, {
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
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                {/* Customer-level Summary */}
                <PaymentSummaryCard mobileNumber={invoice.mobileNumber} customerName={invoice.customerName} />

                {/* Current Invoice Payment Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-8">Current Invoice Payment</h2>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 mb-8 border-b border-gray-100 pb-8">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Customer Name</p>
                            <p className="font-bold text-gray-900 text-lg">{invoice.customerName}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Mobile Number</p>
                            <p className="font-bold text-gray-900 text-lg">{invoice.mobileNumber}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Purchase Date</p>
                            <p className="font-bold text-gray-900 text-lg">{new Date(invoice.purchaseDate).toLocaleDateString('en-GB')}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Invoice Total</p>
                            <p className="font-bold text-blue-600 text-xl">₹{invoice.totalAmount.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Payment Input Section */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Enter Paid Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                            <input
                                type="number"
                                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xl font-bold text-gray-900 bg-white"
                                value={paidAmountInput}
                                onChange={(e) => setPaidAmountInput(e.target.value)}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">INR</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <span className="w-3 h-3 bg-gray-300 rounded-full flex items-center justify-center text-white text-[8px]">i</span>
                            Enter the amount received for this specific transaction.
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">LEFT AMOUNT</p>
                            <p className={`text-3xl font-bold ${leftAmount > 1 ? 'text-green-500' : 'text-green-500'}`}>
                                {/* Logic check: usually left amount > 0 is pending (red?), but screen shows Green 0.00. 
                                    If left amount is 0, it should be green. If > 0, maybe red? 
                                    Screenshot 2 shows "Left Amount ₹0.00" in Green. 
                                    I'll follow standard logic: 0 is green, >0 is likely red or just text.
                                    Actually screenshot specific shows green 0.00. 
                                */}
                                ₹{leftAmount.toFixed(2)}
                            </p>
                        </div>

                        <button
                            onClick={handleUpdatePayment}
                            className="bg-[#0284c7] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#0369a1] transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Save size={18} /> Update Payment Record
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
