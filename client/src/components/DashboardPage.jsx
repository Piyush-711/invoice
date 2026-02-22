import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    TrendingUp, Wallet, Clock,
    AlertTriangle, ArrowUpRight, Scale,
    Plus, FileText, Package, Users,
    ChevronRight
} from 'lucide-react';
import Layout from './Layout';
import API_BASE_URL from '../config';

const StatCard = ({ label, value, icon: Icon, color, sub, subColor, delay = 0 }) => {
    const colors = {
        indigo: {
            border: 'border-t-indigo-500',
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
        },
        emerald: {
            border: 'border-t-emerald-500',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
        },
        red: {
            border: 'border-t-red-500',
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
        },
    };
    const c = colors[color] || colors.indigo;

    return (
        <div
            className={`card p-6 border-t-[3px] ${c.border} animate-fade-in-up`}
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 mt-1.5">{value}</h3>
                </div>
                <div className={`p-2.5 ${c.iconBg} ${c.iconColor} rounded-xl`}>
                    <Icon size={22} />
                </div>
            </div>
            {sub && (
                <p className={`text-xs font-semibold flex items-center gap-1 ${subColor || 'text-slate-400'}`}>
                    {sub}
                </p>
            )}
        </div>
    );
};

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

                setStats({
                    sales: summaryRes.data?.totalSales || 0,
                    paid: summaryRes.data?.totalPaid || 0,
                    pending: summaryRes.data?.totalPending || 0,
                    overdueCount: (invoicesRes.data || []).filter(inv => inv.leftAmount > 0).length
                });

                setRecentInvoices((invoicesRes.data || []).slice(0, 6));

                const customerMap = {};
                (invoicesRes.data || []).forEach(inv => {
                    if (!customerMap[inv.customerName]) {
                        customerMap[inv.customerName] = { name: inv.customerName, amount: 0, orders: 0 };
                    }
                    customerMap[inv.customerName].amount += inv.totalAmount;
                    customerMap[inv.customerName].orders += 1;
                });

                setTopCustomers(Object.values(customerMap).sort((a, b) => b.amount - a.amount).slice(0, 4));

            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const formatCurrency = (val) => {
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
        return `₹${Number(val).toFixed(0)}`;
    };

    const avatarColors = [
        'from-indigo-400 to-indigo-600',
        'from-emerald-400 to-emerald-600',
        'from-amber-400 to-amber-600',
        'from-purple-400 to-purple-600',
    ];

    const headerRight = (
        <Link to="/invoices">
            <button className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> New Invoice
            </button>
        </Link>
    );

    if (loading) {
        return (
            <Layout pageTitle="Dashboard" pageSubtitle="Overview of your business" headerRight={headerRight}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-4 w-24 mb-3" />
                            <div className="skeleton h-8 w-32 mb-2" />
                            <div className="skeleton h-3 w-20" />
                        </div>
                    ))}
                </div>
            </Layout>
        );
    }

    return (
        <Layout
            pageTitle="Dashboard"
            pageSubtitle="Here's what's happening with your business today"
            headerRight={headerRight}
        >
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 stagger-children">
                <StatCard
                    label="Total Sales"
                    value={formatCurrency(stats.sales)}
                    icon={TrendingUp}
                    color="indigo"
                    sub={<><ArrowUpRight size={12} /> 12% vs last month</>}
                    subColor="text-emerald-600"
                    delay={0}
                />
                <StatCard
                    label="Amount Received"
                    value={formatCurrency(stats.paid)}
                    icon={Wallet}
                    color="emerald"
                    sub="85% collection rate"
                    subColor="text-emerald-600"
                    delay={80}
                />
                <StatCard
                    label="Pending Amount"
                    value={formatCurrency(stats.pending)}
                    icon={Clock}
                    color="red"
                    sub={`${stats.overdueCount} invoices outstanding`}
                    subColor="text-red-500"
                    delay={160}
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                {/* Create Invoice CTA */}
                <Link
                    to="/invoices"
                    className="relative overflow-hidden rounded-2xl p-6 text-white flex flex-col justify-between group"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', minHeight: 160 }}
                >
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-1">Create Invoice</h3>
                        <p className="text-indigo-200 text-sm mb-5">Generate a GST-ready bill instantly</p>
                        <span className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all">
                            Start Now <ArrowUpRight size={14} />
                        </span>
                    </div>
                    <FileText size={110} className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                </Link>

                {/* Manage Products */}
                <Link
                    to="/add-product"
                    className="card p-6 flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-transform"
                >
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                        <Package size={30} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">Manage Products</h3>
                    <p className="text-slate-400 text-sm">Update stock & pricing</p>
                </Link>

                {/* Low Stock */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4 text-amber-600">
                        <AlertTriangle size={18} />
                        <Link to="/low-stock" className="font-bold text-slate-800 hover:text-indigo-600 transition-colors text-sm">
                            Low Stock Alert
                        </Link>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-amber-500 shadow-sm">
                                <Scale size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">Mettler Scale</p>
                                <p className="text-xs text-amber-600 font-medium">Only 2 left</p>
                            </div>
                        </div>
                        <span className="bg-white text-amber-600 text-[10px] px-2 py-1 rounded border border-amber-200 font-bold uppercase tracking-wide">
                            Restock
                        </span>
                    </div>
                    <Link to="/low-stock" className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium">
                        View All Inventory <ChevronRight size={12} />
                    </Link>
                </div>
            </div>

            {/* Bottom: Recent Invoices + Top Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Recent Invoices */}
                <div className="lg:col-span-2 card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Recent Invoices</h3>
                        <Link to="/customers" className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 flex items-center gap-1">
                            View All <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full data-table text-left">
                            <thead>
                                <tr>
                                    <th>Invoice</th>
                                    <th>Customer</th>
                                    <th>Status</th>
                                    <th className="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentInvoices.map(inv => (
                                    <tr key={inv._id}>
                                        <td className="text-sm font-semibold text-indigo-600">
                                            #INV-{inv.invoiceNo.toString().padStart(4, '0')}
                                        </td>
                                        <td className="text-sm text-slate-800 font-medium">{inv.customerName}</td>
                                        <td>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                                                ${inv.leftAmount <= 0
                                                    ? 'badge-paid'
                                                    : inv.paidAmount > 0
                                                        ? 'badge-partial'
                                                        : 'badge-due'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${inv.leftAmount <= 0 ? 'bg-emerald-500' : inv.paidAmount > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                {inv.leftAmount <= 0 ? 'Paid' : inv.paidAmount > 0 ? 'Partial' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td className="text-sm font-bold text-slate-800 text-right">
                                            ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                                {recentInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No invoices yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Customers */}
                <div className="card p-6">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-bold text-slate-800">Top Customers</h3>
                        <Link to="/customers" className="text-indigo-600 text-xs font-semibold hover:text-indigo-700">
                            View All
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {topCustomers.map((cust, idx) => (
                            <div key={idx} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                        {cust.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 leading-tight">{cust.name}</p>
                                        <p className="text-xs text-slate-400">{cust.orders} order{cust.orders !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <p className="font-bold text-slate-900 text-sm">{formatCurrency(cust.amount)}</p>
                            </div>
                        ))}
                        {topCustomers.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
                        )}
                    </div>

                    {/* Customers CTA */}
                    <Link
                        to="/customers"
                        className="mt-6 flex items-center justify-center gap-2 w-full border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-sm font-semibold py-2.5 rounded-xl transition-all"
                    >
                        <Users size={15} /> All Customers
                    </Link>
                </div>
            </div>
        </Layout>
    );
};

export default DashboardPage;
