import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    LayoutDashboard, FileText, Package, Users, PieChart,
    Search, Plus, TrendingUp, Wallet, Clock,
    AlertTriangle, Phone, ArrowUpRight, Scale
} from 'lucide-react';
import API_BASE_URL from '../config';

const DashboardPage = () => {
    const [stats, setStats] = useState({ sales: 0, paid: 0, pending: 0, overdueCount: 0 });
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [summaryRes, invoicesRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/invoice/all-summary`),
                    axios.get(`${API_BASE_URL}/invoice`)
                ]);

                // Stats
                setStats({
                    sales: summaryRes.data.totalSales,
                    paid: summaryRes.data.totalPaid,
                    pending: summaryRes.data.totalPending,
                    overdueCount: invoicesRes.data.filter(inv => inv.leftAmount > 0).length // Simplistic overdue logic
                });

                // Recent Invoices (Last 5)
                setRecentInvoices(invoicesRes.data.slice(0, 5));

                // Top Customers Calculation
                const customerMap = {};
                invoicesRes.data.forEach(inv => {
                    if (!customerMap[inv.customerName]) {
                        customerMap[inv.customerName] = {
                            name: inv.customerName,
                            amount: 0,
                            orders: 0
                        };
                    }
                    customerMap[inv.customerName].amount += inv.totalAmount;
                    customerMap[inv.customerName].orders += 1;
                });

                const sortedCustomers = Object.values(customerMap)
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 3); // Top 3

                setTopCustomers(sortedCustomers);

            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatCurrency = (val) => {
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
        return `₹${val.toFixed(0)}`;
    };

    return (
        <div className="flex min-h-screen bg-[#f3f4f6] font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-lg font-bold text-xl">S</div>
                        <h1 className="font-bold text-gray-800 text-lg">Ambika Sales</h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    <Link to="/" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium">
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>

                    <div className="pt-6 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Business</div>
                    <Link to="/invoices" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                        <FileText size={20} /> Invoices
                    </Link>
                    <Link to="/add-product" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                        <Package size={20} /> Inventory
                    </Link>
                    <Link to="/customers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                        <Users size={20} /> Customers
                    </Link>
                    <Link to="/summary" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                        <PieChart size={20} /> Reports
                    </Link>
                </nav>

                <div className="p-4 m-4 bg-[#0284c7] rounded-xl text-white">
                    <p className="text-sm font-semibold mb-1">Need Help?</p>
                    <p className="text-xs text-blue-100 mb-3">Contact Support</p>
                    <button className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 rounded-lg transition">
                        Call Now
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Top Header */}
                <header className="bg-white/50 backdrop-blur-sm sticky top-0 z-10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Good Morning, Admin <span className="text-2xl">👋</span>
                        </h2>
                        <p className="text-gray-500 text-sm">Here's what's happening with your business today.</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Quick Search..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                        <Link to="/invoices">
                            <button className="bg-[#0284c7] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm hover:bg-[#0369a1] transition whitespace-nowrap">
                                <Plus size={18} /> New Invoice
                            </button>
                        </Link>
                    </div>
                </header>

                <div className="p-6 max-w-7xl mx-auto space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Sales Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-b-[#0284c7]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">TOTAL SALES</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.sales)}</h3>
                                </div>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <ArrowUpRight size={14} /> 12% vs last month
                            </p>
                        </div>

                        {/* Received Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-b-[#10b981]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">RECEIVED</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.paid)}</h3>
                                </div>
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <Wallet size={24} />
                                </div>
                            </div>
                            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                85% collection rate
                            </p>
                        </div>

                        {/* Pending Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-b-[#ef4444]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">PENDING</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.pending)}</h3>
                                </div>
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                    <Clock size={24} />
                                </div>
                            </div>
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                {stats.overdueCount} Invoices overdue
                            </p>
                        </div>
                    </div>

                    {/* Middle Section: Actions & Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Quick Actions - Create Invoice */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-1">Create Invoice</h3>
                                <p className="text-blue-100 text-sm mb-6">Generate new bill instantly</p>
                                <Link to="/invoices">
                                    <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
                                        Start Now <ArrowUpRight size={16} />
                                    </button>
                                </Link>
                            </div>
                            <FileText size={120} className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition duration-500" />
                        </div>

                        {/* Manage Products */}
                        <Link to="/add-product" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-100 transition group flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition">
                                <Package size={32} />
                            </div>
                            <h3 className="font-bold text-gray-800">Manage Products</h3>
                            <p className="text-gray-500 text-sm mt-1">Update stock & pricing</p>
                        </Link>

                        {/* Low Stock Alert */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-4 text-[#ea580c]">
                                <AlertTriangle size={20} />
                                <Link to="/low-stock" className="font-bold text-gray-800 hover:text-orange-600 transition-colors">Low Stock Alert</Link>
                            </div>

                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg text-orange-500 shadow-sm">
                                        <Scale size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Mettler Scale</p>
                                        <p className="text-xs text-orange-600 font-medium">Only 2 left</p>
                                    </div>
                                </div>
                                <span className="bg-white text-orange-600 text-xs px-2 py-1 rounded border border-orange-200 font-bold uppercase">Restock</span>
                            </div>

                            <Link to="/low-stock" className="block w-full mt-4 text-center text-gray-400 text-xs hover:text-gray-600 transition">
                                View All Inventory
                            </Link>
                        </div>
                    </div>

                    {/* Bottom Section: Recent Invoices & Top Customers */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Invoices */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">Recent Invoices</h3>
                                <Link to="/customers" className="text-blue-600 text-sm font-medium hover:underline">View All</Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                        <tr>
                                            <th className="px-6 py-3">Invoice</th>
                                            <th className="px-6 py-3">Customer</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {recentInvoices.map(inv => (
                                            <tr key={inv._id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 text-sm font-medium text-blue-600">#{inv.invoiceNo}</td>
                                                <td className="px-6 py-4 text-sm text-gray-800">{inv.customerName}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded textxs font-bold text-[10px] uppercase tracking-wide
                                                    ${inv.leftAmount <= 0 ? 'bg-green-100 text-green-700' : inv.paidAmount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                        {inv.leftAmount <= 0 ? 'Paid' : inv.paidAmount > 0 ? 'Partial' : 'Unpaid'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">₹{inv.totalAmount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Customers */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-800 mb-6">Top Customers</h3>
                            <div className="space-y-6">
                                {topCustomers.map((cust, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold 
                                                ${idx === 0 ? 'bg-blue-100 text-blue-600' : idx === 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {cust.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{cust.name}</p>
                                                <p className="text-xs text-gray-500">{cust.orders} Orders</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-gray-900 text-sm">
                                            {formatCurrency(cust.amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
};

export default DashboardPage;
