import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Scan, Edit, Trash2, Search, FileDown, Box, Plus, X, Check } from 'lucide-react';
import Layout from './Layout';
import API_BASE_URL from '../config';

const AddProductPage = () => {
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: { barcode: '', name: '', hsnCode: '', defaultPrice: '', taxRate: 18, unit: 'pcs' }
    });

    const [products, setProducts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    React.useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/products`);
            setProducts(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error('Error fetching products:', err); }
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true); setStatusMessage(null);
        try {
            const payload = { ...data, defaultPrice: Number(data.defaultPrice), taxRate: Number(data.taxRate) };
            if (editingId) {
                await axios.put(`${API_BASE_URL}/products/${editingId}`, payload);
                setStatusMessage({ type: 'success', text: 'Product updated successfully!' });
                setEditingId(null);
            } else {
                await axios.post(`${API_BASE_URL}/products`, payload);
                setStatusMessage({ type: 'success', text: 'Product added successfully!' });
            }
            reset({ barcode: '', name: '', hsnCode: '', defaultPrice: '', taxRate: 18, unit: 'pcs' });
            fetchProducts();
        } catch (err) {
            if (err.response?.status === 409) {
                setStatusMessage({ type: 'error', text: 'A product with this barcode already exists!' });
            } else {
                setStatusMessage({ type: 'error', text: 'Failed to save product. Please try again.' });
            }
        } finally { setIsSubmitting(false); }
    };

    const handleEdit = (product) => {
        setEditingId(product._id);
        reset({ barcode: product.barcode || '', name: product.name, hsnCode: product.hsnCode || '', defaultPrice: product.defaultPrice, taxRate: product.taxRate || 0, unit: product.unit || 'pcs' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/products/${id}`);
            setStatusMessage({ type: 'success', text: 'Product deleted.' });
            fetchProducts();
        } catch { setStatusMessage({ type: 'error', text: 'Failed to delete product.' }); }
    };

    const handleCancel = () => {
        setEditingId(null);
        reset({ barcode: '', name: '', hsnCode: '', defaultPrice: '', taxRate: 18, unit: 'pcs' });
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const headerRight = (
        <button className="btn-secondary text-sm flex items-center gap-2">
            <FileDown size={15} className="text-emerald-600" /> Export
        </button>
    );

    return (
        <Layout pageTitle="Product Management" pageSubtitle="Manage your product catalog and inventory" headerRight={headerRight}>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* === Form Panel === */}
                <div className="lg:col-span-1">
                    <div className="card p-6 sticky top-4">
                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                            <div className={`p-2 rounded-xl ${editingId ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {editingId ? <Edit size={18} /> : <Plus size={18} />}
                            </div>
                            <h2 className="font-bold text-slate-800">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                        </div>

                        {/* Status Message */}
                        {statusMessage && (
                            <div className={`mb-4 p-3 rounded-xl text-sm font-medium flex items-start gap-2 ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                {statusMessage.type === 'success' ? <Check size={16} className="mt-0.5 flex-shrink-0" /> : <X size={16} className="mt-0.5 flex-shrink-0" />}
                                {statusMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Barcode */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Barcode / SKU</label>
                                <div className="relative">
                                    <Scan size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        {...register('barcode')}
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-400 transition-all placeholder-slate-300"
                                        placeholder="Scan or type barcode..."
                                    />
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                                    Product Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    {...register('name', { required: 'Product name is required' })}
                                    className={`w-full border ${errors.name ? 'border-red-300' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-400 transition-all placeholder-slate-300`}
                                    placeholder="e.g. Weighing Scale 5kg"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            {/* Price + HSN */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Price (₹) <span className="text-red-400">*</span></label>
                                    <input
                                        type="number" step="0.01"
                                        {...register('defaultPrice', { required: 'Required', min: 0.1 })}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-400 transition-all placeholder-slate-300"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">HSN Code</label>
                                    <input
                                        {...register('hsnCode')}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-400 transition-all placeholder-slate-300"
                                        placeholder="1234"
                                    />
                                </div>
                            </div>

                            {/* Tax + Unit */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Tax Rate</label>
                                    <select {...register('taxRate')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-400 transition-all bg-white appearance-none">
                                        <option value="0">GST 0%</option>
                                        <option value="5">GST 5%</option>
                                        <option value="12">GST 12%</option>
                                        <option value="18">GST 18%</option>
                                        <option value="28">GST 28%</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Unit</label>
                                    <select {...register('unit')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-400 transition-all bg-white appearance-none">
                                        <option value="pcs">Pieces (pcs)</option>
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="mtr">Meters (mtr)</option>
                                        <option value="box">Box</option>
                                    </select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className={`flex-1 flex justify-center items-center gap-2 font-bold py-3 px-4 rounded-xl text-white shadow-sm transition-all active:scale-95 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'} ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Saving...' : editingId ? <><Save size={16} /> Update Product</> : <><Plus size={16} /> Add Product</>}
                                </button>
                                {editingId && (
                                    <button type="button" onClick={handleCancel} className="btn-secondary px-4">
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* === Product List === */}
                <div className="lg:col-span-2">
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-slate-800">Product List</h2>
                                <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">{products.length}</span>
                            </div>
                            <div className="relative w-full sm:w-60">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-indigo-400 transition-all"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full data-table text-left">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Barcode</th>
                                        <th>Price</th>
                                        <th>Unit</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center">
                                                <Box size={40} className="mx-auto mb-2 text-slate-200" />
                                                <p className="text-slate-400 text-sm font-medium">No products found.</p>
                                                <p className="text-slate-300 text-xs mt-1">Add a product using the form.</p>
                                            </td>
                                        </tr>
                                    ) : filteredProducts.map(product => (
                                        <tr key={product._id} className="group">
                                            <td>
                                                <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                                                {product.hsnCode && <p className="text-[10px] text-slate-400 font-mono mt-0.5">HSN: {product.hsnCode}</p>}
                                            </td>
                                            <td>
                                                <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                    {product.barcode || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="font-bold text-slate-900 text-sm">
                                                ₹{Number(product.defaultPrice).toLocaleString('en-IN')}
                                            </td>
                                            <td>
                                                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-1 rounded-lg uppercase">
                                                    {product.unit}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-500 flex items-center justify-center transition-colors"
                                                        title="Edit"
                                                    ><Edit size={14} /></button>
                                                    <button
                                                        onClick={() => handleDelete(product._id)}
                                                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors"
                                                        title="Delete"
                                                    ><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                            <span className="font-medium">Showing {filteredProducts.length} of {products.length} products</span>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AddProductPage;
