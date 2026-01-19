import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AllInvoicesSummaryPage = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await axios.get('http://localhost:5000/invoice/all-summary');
                setSummary(res.data);
            } catch (err) {
                console.error("Failed to fetch all summary", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    if (loading) return <div className="text-center p-10">Loading summary...</div>;
    if (!summary) return <div className="text-center p-10 text-red-500">Failed to load data.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <Link
                    to="/customers"
                    className="inline-flex items-center gap-2 bg-gray-600 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors shadow-md mb-6"
                >
                    <ArrowLeft size={20} /> Back to Customer List
                </Link>

                <h1 className="text-3xl font-bold text-gray-800 mb-8">Grand Total Payment Summary</h1>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Total Sales */}
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                            <p className="text-blue-600 font-semibold uppercase tracking-wider mb-2">Grand Total Sales</p>
                            <p className="text-3xl font-bold text-blue-900">₹{summary.totalSales.toFixed(2)}</p>
                        </div>

                        {/* Total Paid */}
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                            <p className="text-green-600 font-semibold uppercase tracking-wider mb-2">Grand Total Paid</p>
                            <p className="text-3xl font-bold text-green-900">₹{summary.totalPaid.toFixed(2)}</p>
                        </div>

                        {/* Total Pending */}
                        <div className={`p-6 rounded-xl border text-center ${summary.totalPending > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                            <p className={`${summary.totalPending > 0 ? 'text-red-600' : 'text-gray-600'} font-semibold uppercase tracking-wider mb-2`}>
                                Grand Total Pending
                            </p>
                            <p className={`text-3xl font-bold ${summary.totalPending > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                                ₹{summary.totalPending.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllInvoicesSummaryPage;
