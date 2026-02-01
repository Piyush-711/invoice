import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentSummaryCard = ({ mobileNumber, customerName }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            if (!mobileNumber) return;
            try {
                const encodedMobile = encodeURIComponent(mobileNumber);
                const res = await axios.get(`http://localhost:5000/invoice/customer-summary?mobileNumber=${encodedMobile}`);
                setSummary(res.data);
            } catch (err) {
                console.error("Failed to fetch payment summary", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [mobileNumber]);

    if (loading) return <div className="p-4 text-center text-gray-500">Loading summary...</div>;
    if (!summary) return null;

    return (
        <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
                Payment Summary for <span className="text-blue-600">{customerName || 'Customer'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Sales */}
                <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">Total Sales Amount</p>
                    <p className="text-3xl font-bold text-gray-900">₹{summary.totalSales.toFixed(2)}</p>
                </div>

                {/* Total Paid */}
                <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
                    <p className="text-green-600 text-xs font-bold uppercase tracking-wider mb-2">Total Paid Amount</p>
                    <p className="text-3xl font-bold text-gray-900">₹{summary.totalPaid.toFixed(2)}</p>
                </div>

                {/* Total Pending */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Pending / Left</p>
                    <p className="text-3xl font-bold text-gray-900">₹{summary.totalPending.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentSummaryCard;
