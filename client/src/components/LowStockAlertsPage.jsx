import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertTriangle, Ban, Battery, Coins, Plus } from 'lucide-react';
import Layout from './Layout';
import API_BASE_URL from '../config';

const LowStockAlertsPage = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [restockQty, setRestockQty] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', sku: '', initialStock: 0, reorderLevel: 5, price: 0 });

    const getStockStatus = (product) => {
        const qty = Number(product.quantity) || 0;
        const reorder = Number(product.reorderLevel) || 5;
        if (qty <= 0) return { label: 'Critical', barColor: 'bg-red-500', priority: 1 };
        if (qty <= reorder) return { label: 'Low Stock', barColor: 'bg-amber-500', priority: 2 };
        return { label: 'In Stock', barColor: 'bg-emerald-500', priority: 3 };
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/products`);
            const sorted = res.data.sort((a, b) => {
                const aS = getStockStatus(a), bS = getStockStatus(b);
                if (aS.priority !== bS.priority) return aS.priority - bS.priority;
                return a.name.localeCompare(b.name);
            });
            setProducts(sorted);
        } catch (err) {
            console.error('Failed to fetch products', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const alerts = products.map(p => {
        const status = getStockStatus(p);
        const qty = Number(p.quantity) || 0;
        const reorder = Number(p.reorderLevel) || 5;
        const maxRef = Math.max(reorder * 2, 10);
        const width = Math.min((qty / maxRef) * 100, 100);
        return { ...p, statusLabel: status.label, barColor: status.barColor, barWidth: `${width}%` };
    }).filter(p => p.statusLabel !== 'In Stock');

    const filteredAlerts = activeTab === 'all' ? alerts
        : alerts.filter(a => a.statusLabel === (activeTab === 'critical' ? 'Critical' : 'Low Stock'));

    const outOfStockCount = products.filter(p => (Number(p.quantity) || 0) <= 0).length;
    const lowStockCount = products.filter(p => {
        const qty = Number(p.quantity) || 0;
        const reorder = Number(p.reorderLevel) || 5;
        return qty > 0 && qty <= reorder;
    }).length;
    const estRestockCost = products.reduce((acc, p) => {
        const qty = Number(p.quantity) || 0;
        const reorder = Number(p.reorderLevel) || 5;
        if (qty <= reorder) {
            return acc + ((reorder * 2 - qty) * (Number(p.defaultPrice) || 0));
        }
        return acc;
    }, 0);

    const handleRestockClick = (product) => { setSelectedProduct(product); setRestockQty(''); setIsModalOpen(true); };
    const handleConfirmRestock = async () => {
        if (!restockQty || Number(restockQty) <= 0) return;
        try {
            const newQty = (Number(selectedProduct.quantity) || 0) + Number(restockQty);
            await axios.put(`${API_BASE_URL}/products/${selectedProduct._id}`, { quantity: newQty });
            await fetchProducts();
            setIsModalOpen(false);
        } catch (err) {
            console.error('Failed to update stock', err);
            alert('Failed to update stock');
        }
    };
    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.price) { alert('Name and Price are required!'); return; }
        try {
            await axios.post(`${API_BASE_URL}/products`, {
                name: newProduct.name, defaultPrice: newProduct.price, barcode: newProduct.sku,
                quantity: newProduct.initialStock, reorderLevel: newProduct.reorderLevel
            });
            await fetchProducts();
            setIsAddModalOpen(false);
            setNewProduct({ name: '', sku: '', initialStock: 0, reorderLevel: 5, price: 0 });
        } catch (err) {
            console.error('Failed to add product', err);
            alert(err.response?.data?.message || 'Failed to add product');
        }
    };

    const headerRight = (
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={15} /> Add Product
        </button>
    );

    if (loading && products.length === 0) return (
        <Layout pageTitle="Low Stock Alerts" pageSubtitle="Monitor inventory levels" headerRight={headerRight}>
            <div className="card p-8 text-center text-slate-400 animate-pulse">Loading inventory...</div>
        </Layout>
    );

    return (
        <Layout pageTitle="Low Stock Alerts" pageSubtitle="Monitor inventory levels and restock" headerRight={headerRight}>
            <div className={`space-y-5 ${(isModalOpen || isAddModalOpen) ? 'blur-sm brightness-90' : ''} transition-all duration-300`}>

                <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
                    <ArrowLeft size={14} /> Back to Dashboard
                </Link>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
                    <div className="card p-6 border-t-[3px] border-t-red-500 animate-fade-in-up" style={{ animationFillMode: 'both' }}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-red-500 text-xs font-bold uppercase tracking-wider mb-1">Out of Stock</p>
                                <div className="text-3xl font-extrabold text-slate-900">{outOfStockCount} Items</div>
                            </div>
                            <div className="p-2.5 bg-red-50 text-red-500 rounded-xl"><Ban size={22} /></div>
                        </div>
                        <p className="text-xs text-red-500 font-semibold">Immediate action required</p>
                    </div>

                    <div className="card p-6 border-t-[3px] border-t-amber-500 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">Low Stock</p>
                                <div className="text-3xl font-extrabold text-slate-900">{lowStockCount} Items</div>
                            </div>
                            <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl"><Battery size={22} /></div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Below reorder levels</p>
                    </div>

                    <div className="card p-6 border-t-[3px] border-t-indigo-500 animate-fade-in-up" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-indigo-500 text-xs font-bold uppercase tracking-wider mb-1">Est. Restock Cost</p>
                                <div className="text-3xl font-extrabold text-slate-900">₹{estRestockCost.toLocaleString()}</div>
                            </div>
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Coins size={22} /></div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">To reach healthy levels</p>
                    </div>
                </div>

                {/* Inventory Alerts Table */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="font-bold text-slate-800">Inventory Alerts</h2>
                        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                            {['critical', 'warning', 'all'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {tab === 'critical' ? 'Critical' : tab === 'warning' ? 'Warning' : 'All Alerts'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full data-table text-left">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Status</th>
                                    <th className="text-center">Current Qty</th>
                                    <th className="text-center">Reorder Level</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAlerts.length > 0 ? filteredAlerts.map(item => (
                                    <tr key={item._id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">📦</div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">SKU: {item.barcode || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.statusLabel === 'Critical' ? 'badge-due' : 'badge-partial'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.statusLabel === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                {item.statusLabel}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="flex flex-col items-center gap-1 w-20 mx-auto">
                                                <span className={`font-bold text-sm ${Number(item.quantity) === 0 ? 'text-red-500' : 'text-amber-600'}`}>{item.quantity}</span>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${item.barColor}`} style={{ width: item.barWidth }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center text-sm font-medium text-slate-500">{item.reorderLevel}</td>
                                        <td className="text-right">
                                            <button onClick={() => handleRestockClick(item)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-lg transition-colors">
                                                <Plus size={12} /> Restock
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" className="py-10 text-center text-slate-400 text-sm">No stock alerts. All good! ✓</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Healthy Inventory */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-slate-800">Healthy Inventory</h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold badge-paid">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Good Standing
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full data-table text-left">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Status</th>
                                    <th className="text-center">Qty</th>
                                    <th className="text-center">Reorder Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.filter(p => !['Critical', 'Low Stock'].includes(getStockStatus(p).label)).map(item => (
                                    <tr key={item._id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">📦</div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">SKU: {item.barcode || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold badge-paid">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
                                            </span>
                                        </td>
                                        <td className="text-center font-bold text-slate-800">{item.quantity}</td>
                                        <td className="text-center text-sm text-slate-500">{item.reorderLevel}</td>
                                    </tr>
                                ))}
                                {products.filter(p => !['Critical', 'Low Stock'].includes(getStockStatus(p).label)).length === 0 && (
                                    <tr><td colSpan="4" className="py-10 text-center text-slate-400">No healthy items yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ===== Restock Modal ===== */}
            {isModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Restock Product</h3>
                                <p className="text-slate-400 text-sm mt-0.5">{selectedProduct.name}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                                <span className="text-lg leading-none">×</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Current Stock</label>
                                    <input type="text" value={selectedProduct.quantity} disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Add Quantity</label>
                                    <input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-bold focus:border-indigo-400 transition-all" placeholder="0" autoFocus />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary py-3">Cancel</button>
                                <button onClick={handleConfirmRestock} className="flex-1 btn-primary py-3">Confirm Restock</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-lg">Add New Product</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                                <span className="text-lg leading-none">×</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Product Name</label>
                                <input type="text" placeholder="e.g. New Item" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">SKU / Barcode</label>
                                    <input type="text" placeholder="ITEM-001" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Initial Stock</label>
                                    <input type="number" placeholder="0" value={newProduct.initialStock} onChange={e => setNewProduct({ ...newProduct, initialStock: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-400 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Reorder Level</label>
                                    <input type="number" value={newProduct.reorderLevel} onChange={e => setNewProduct({ ...newProduct, reorderLevel: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Price (₹)</label>
                                    <input type="number" placeholder="0.00" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-400 transition-all" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 btn-secondary py-3">Cancel</button>
                                <button onClick={handleAddProduct} className="flex-1 btn-primary py-3">Save Product</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default LowStockAlertsPage;
