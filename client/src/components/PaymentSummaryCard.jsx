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
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 transform transition hover:shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                Payment Summary for {customerName || mobileNumber}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Sales */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-1">Total Sales Amount</p>
                    <p className="text-2xl font-bold text-blue-900">₹{summary.totalSales.toFixed(2)}</p>
                </div>

                {/* Total Paid */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-green-600 text-sm font-semibold uppercase tracking-wider mb-1">Total Paid Amount</p>
                    <p className="text-2xl font-bold text-green-900">₹{summary.totalPaid.toFixed(2)}</p>
                </div>

                {/* Total Pending */}
                <div className={`p-4 rounded-lg border ${summary.totalPending > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`${summary.totalPending > 0 ? 'text-red-600' : 'text-gray-600'} text-sm font-semibold uppercase tracking-wider mb-1`}>
                        Total Pending / Left
                    </p>
                    <p className={`text-2xl font-bold ${summary.totalPending > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                        ₹{summary.totalPending.toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentSummaryCard;
