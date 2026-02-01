import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft,
    AlertTriangle,
    Ban,
    Battery,
    Coins,
    Search,
    Download,
    Plus,
    ChevronLeft,
    ChevronRight,
    Filter
} from 'lucide-react';
import API_BASE_URL from '../config';

const LowStockAlertsPage = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/products`);
            // Sort by status priority: Out of Stock -> Low Stock -> OK
            const sorted = res.data.sort((a, b) => {
                const aStatus = getStockStatus(a);
                const bStatus = getStockStatus(b);
                if (aStatus.priority !== bStatus.priority) return aStatus.priority - bStatus.priority;
                return a.name.localeCompare(b.name);
            });
            setProducts(sorted);
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const getStockStatus = (product) => {
        const qty = Number(product.quantity) || 0;
        const reorder = Number(product.reorderLevel) || 5;

        if (qty <= 0) return { label: 'Critical', color: 'bg-red-100 text-red-600', barColor: 'bg-red-500', priority: 1 };
        if (qty <= reorder) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-600', barColor: 'bg-orange-500', priority: 2 };
        return { label: 'In Stock', color: 'bg-green-100 text-green-600', barColor: 'bg-green-500', priority: 3 };
    };

    const alerts = products.map(p => {
        const status = getStockStatus(p);
        const qty = Number(p.quantity) || 0;
        const reorder = Number(p.reorderLevel) || 5;
        // Calculate bar width (max 100%)
        // Assume slightly more than reorder level is 100% for visual context, e.g. 2x reorder
        const maxRef = Math.max(reorder * 2, 10);
        const width = Math.min((qty / maxRef) * 100, 100);

        return {
            ...p,
            status: status.label,
            color: status.color,
            barColor: status.barColor,
            barWidth: `${width}%`
        };
    }).filter(p => p.status !== 'In Stock'); // Only show alerts by default in the list, or we could show all

    const filteredAlerts = activeTab === 'all'
        ? alerts
        : alerts.filter(a => a.status === (activeTab === 'critical' ? 'Critical' : 'Low Stock'));

    // Stats Calculation
    const outOfStockCount = products.filter(p => (Number(p.quantity) || 0) <= 0).length;
    const lowStockCount = products.filter(p => {
        const qty = Number(p.quantity) || 0;
        const reorder = Number(p.reorderLevel) || 5;
        return qty > 0 && qty <= reorder;
    }).length;

    // Estimate restock cost: Cost to fill up to (reorderLevel * 2) for all low/out stock items
    // Assuming 'defaultPrice' as cost (which is inaccurate but all we have, ideally we need 'costPrice')
    const estRestockCost = products.reduce((acc, p) => {
        const qty = Number(p.quantity) || 0;
        const reorder = Number(p.reorderLevel) || 5;
        if (qty <= reorder) {
            const needed = (reorder * 2) - qty;
            return acc + (needed * (Number(p.defaultPrice) || 0));
        }
        return acc;
    }, 0);


    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [restockQty, setRestockQty] = useState('');

    const handleRestockClick = (product) => {
        setSelectedProduct(product);
        setRestockQty('');
        setIsModalOpen(true);
    };

    const handleConfirmRestock = async () => {
        if (!restockQty || Number(restockQty) <= 0) return;

        try {
            const newQty = (Number(selectedProduct.quantity) || 0) + Number(restockQty);
            await axios.put(`${API_BASE_URL}/products/${selectedProduct._id}`, {
                quantity: newQty
            });
            await fetchProducts(); // Refresh
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to update stock", err);
            alert("Failed to update stock");
        }
    };

    // Add Product Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        initialStock: 0,
        reorderLevel: 5,
        price: 0
    });

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.price) {
            alert("Name and Price are required!");
            return;
        }

        try {
            const payload = {
                name: newProduct.name,
                defaultPrice: newProduct.price,
                barcode: newProduct.sku,
                quantity: newProduct.initialStock,
                reorderLevel: newProduct.reorderLevel
            };
            await axios.post(`${API_BASE_URL}/products`, payload);
            await fetchProducts(); // Refresh list
            setIsAddModalOpen(false);
            setNewProduct({ name: '', sku: '', initialStock: 0, reorderLevel: 5, price: 0 });
        } catch (err) {
            console.error("Failed to add product", err);
            alert(err.response?.data?.message || "Failed to add product");
        }
    };

    if (loading && products.length === 0) return <div className="text-center p-10">Loading Inventory...</div>;

    return (
        <div className="min-h-screen bg-[#f3f4f6] p-6 font-sans relative">
            <div className={`max-w-7xl mx-auto space-y-6 ${(isModalOpen || isAddModalOpen) ? 'blur-sm brightness-90' : ''} transition-all duration-300`}>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-2 transition-colors">
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                                <AlertTriangle size={24} />
                            </span>
                            Low Stock Alerts
                        </h1>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-white border border-gray-200 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 flex items-center gap-2 shadow-sm border-blue-100"
                        >
                            <Plus size={16} /> Add Product
                        </button>
                        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                            <Filter size={16} /> Full Inventory
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Out of Stock */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-red-500 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-red-500 font-bold text-xs uppercase tracking-wider mb-1">OUT OF STOCK</h3>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{outOfStockCount} Items</div>
                                <p className="text-red-500 text-xs font-medium">Immediate Action Required</p>
                            </div>
                            <div className="p-2 bg-red-50 rounded-full text-red-500">
                                <Ban size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Low Stock */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-orange-500 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-orange-500 font-bold text-xs uppercase tracking-wider mb-1">LOW STOCK</h3>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{lowStockCount} Items</div>
                                <p className="text-gray-500 text-xs text-opacity-80">Below reorder levels</p>
                            </div>
                            <div className="p-2 bg-orange-50 rounded-full text-orange-500">
                                <Battery size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Restock Cost */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-blue-500 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-blue-500 font-bold text-xs uppercase tracking-wider mb-1">EST. RESTOCK COST</h3>
                                <div className="text-3xl font-bold text-gray-900 mb-1">₹{estRestockCost.toLocaleString()}</div>
                                <p className="text-gray-500 text-xs text-opacity-80">To reach healthy levels</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-full text-blue-500">
                                <Coins size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-lg font-bold text-gray-800">Inventory Alerts</h2>

                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('critical')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'critical' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                • Critical
                            </button>
                            <button
                                onClick={() => setActiveTab('warning')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'warning' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                • Warning
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                All Alerts
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Product Details</th>
                                    <th className="px-6 py-4">Stock Status</th>
                                    <th className="px-6 py-4 text-center">Current Qty</th>
                                    <th className="px-6 py-4 text-center">Reorder Lvl</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredAlerts.length > 0 ? filteredAlerts.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                                                    📦
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">SKU: {item.barcode || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${item.color}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1 w-24 mx-auto">
                                                <span className={`text-sm font-bold ${Number(item.quantity) === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                                                    {item.quantity}
                                                </span>
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${item.barColor}`} style={{ width: item.barWidth }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                                            {item.reorderLevel}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRestockClick(item)}
                                                className="border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1">
                                                <Plus size={14} /> Restock
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-6 text-center text-gray-400 text-sm">
                                            No stock alerts found. Good job!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Healthy Inventory Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Healthy Inventory</h2>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Good Standing
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Product Details</th>
                                    <th className="px-6 py-4">Stock Status</th>
                                    <th className="px-6 py-4 text-center">Current Qty</th>
                                    <th className="px-6 py-4 text-center">Reorder Lvl</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {products.filter(p => !['Critical', 'Low Stock'].includes(getStockStatus(p).label)).map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-xl text-green-600">
                                                    📦
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">SKU: {item.barcode || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-600">
                                                Good
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-lg font-bold text-gray-800">{item.quantity}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                                            {item.reorderLevel}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {products.filter(p => !['Critical', 'Low Stock'].includes(getStockStatus(p).label)).length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-400">
                                            No healthy items found. Time to restock!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-500">
                        <span>Showing {products.filter(p => !['Critical', 'Low Stock'].includes(getStockStatus(p).label)).length} healthy items</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 transition disabled:opacity-50 font-medium">
                                Previous
                            </button>
                            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 transition disabled:opacity-50 font-medium">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Restock Modal */}
            {
                isModalOpen && selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                            onClick={() => setIsModalOpen(false)}
                        ></div>

                        {/* Modal Content */}
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform scale-100 transition-all z-10 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-800">Restock Product</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Product Name</label>
                                    <p className="text-lg font-bold text-gray-900">{selectedProduct.name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Current</label>
                                        <input
                                            type="text"
                                            value={selectedProduct.quantity}
                                            disabled
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 font-bold focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-800 mb-1">Add Qty</label>
                                        <input
                                            type="number"
                                            value={restockQty}
                                            onChange={(e) => setRestockQty(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                            placeholder="0"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 pt-2 flex gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmRestock}
                                    className="flex-1 py-2.5 bg-[#0284c7] text-white rounded-lg font-bold hover:bg-[#0369a1] shadow-sm shadow-blue-200 transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Product Modal */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                            onClick={() => setIsAddModalOpen(false)}
                        ></div>

                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform scale-100 transition-all z-10 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-800">Add New Product</h3>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Product Name</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                        placeholder="e.g. New Item"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">SKU / Barcode</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="e.g. ITEM-001"
                                            value={newProduct.sku}
                                            onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Initial Stock</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="0"
                                            value={newProduct.initialStock}
                                            onChange={(e) => setNewProduct({ ...newProduct, initialStock: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Reorder Level</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            value={newProduct.reorderLevel}
                                            onChange={(e) => setNewProduct({ ...newProduct, reorderLevel: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="0.00"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 pt-2 flex gap-3">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddProduct}
                                    className="flex-1 py-2.5 bg-[#0284c7] text-white rounded-lg font-bold hover:bg-[#0369a1] shadow-sm shadow-blue-200 transition-colors"
                                >
                                    Save Product
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default LowStockAlertsPage;
