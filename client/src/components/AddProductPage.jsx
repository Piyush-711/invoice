import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, ShoppingBag, Scan, Edit, Trash2, Search, FileDown, Box, Plus } from 'lucide-react';
import API_BASE_URL from '../config';

const AddProductPage = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            barcode: '',
            name: '',
            hsnCode: '',
            defaultPrice: '',
            taxRate: 18,
            unit: 'pcs'
        }
    });

    const [products, setProducts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Fetch products on mount
    React.useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products`);
            setProducts(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setStatusMessage(null);
        try {
            const payload = {
                ...data,
                defaultPrice: Number(data.defaultPrice),
                taxRate: Number(data.taxRate)
            };

            if (editingId) {
                // Update existing product
                await axios.put(`${API_BASE_URL}/products/${editingId}`, payload);
                setStatusMessage({ type: 'success', text: 'Product updated successfully!' });
                setEditingId(null);
            } else {
                // Create new product
                await axios.post(`${API_BASE_URL}/products`, payload);
                setStatusMessage({ type: 'success', text: 'Product added successfully!' });
            }

            reset({
                barcode: '',
                name: '',
                hsnCode: '',
                defaultPrice: '',
                taxRate: 18,
                unit: 'pcs'
            });
            fetchProducts(); // Refresh list
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 409) {
                setStatusMessage({ type: 'error', text: 'Product with this Barcode already exists!' });
            } else {
                setStatusMessage({ type: 'error', text: 'Failed to save product. Please try again.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (product) => {
        setEditingId(product._id);
        reset({
            barcode: product.barcode || '',
            name: product.name,
            hsnCode: product.hsnCode || '',
            defaultPrice: product.defaultPrice,
            taxRate: product.taxRate || 0,
            unit: product.unit || 'pcs'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            await axios.delete(`${API_BASE_URL}/products/${id}`);
            setStatusMessage({ type: 'success', text: 'Product deleted successfully!' });
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            setStatusMessage({ type: 'error', text: 'Failed to delete product.' });
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        reset({
            barcode: '',
            name: '',
            hsnCode: '',
            defaultPrice: '',
            taxRate: 18,
            unit: 'pcs'
        });
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-2 transition-colors">
                            <ArrowLeft size={16} /> Back to Invoice Builder
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                <Box size={24} />
                            </span>
                            Product Management
                        </h1>
                    </div>

                    <div>
                        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                            <FileDown size={16} className="text-green-600" /> Export List
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Add Product Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">
                                {editingId ? 'Edit Product' : 'Add New Product'}
                            </h2>

                            {statusMessage && (
                                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {statusMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                {/* Barcode / SKU */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Barcode / SKU</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Scan size={18} />
                                        </div>
                                        <input
                                            {...register('barcode')}
                                            className="w-full pl-10 pr-10 border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="Scan or Type..."
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600">
                                            <Scan size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Product Name */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Product Name <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('name', { required: "Product Name is required" })}
                                        className={`w-full border ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400`}
                                        placeholder="e.g. Weighing Scale 5kg"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
                                </div>

                                {/* Price & HSN */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Price (₹) <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('defaultPrice', { required: "Price is required", min: 0.1 })}
                                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">HSN Code</label>
                                        <input
                                            {...register('hsnCode')}
                                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="1234"
                                        />
                                    </div>
                                </div>

                                {/* Tax & Unit */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Tax Rate</label>
                                        <div className="relative">
                                            <select
                                                {...register('taxRate')}
                                                className="w-full appearance-none border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-white"
                                            >
                                                <option value="0">GST 0%</option>
                                                <option value="5">GST 5%</option>
                                                <option value="12">GST 12%</option>
                                                <option value="18">GST 18%</option>
                                                <option value="28">GST 28%</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Unit</label>
                                        <div className="relative">
                                            <select // Simplistic implementation, ideally this could be an input with suggestions or fixed list based on needs
                                                {...register('unit')}
                                                className="w-full appearance-none border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-white"
                                            >
                                                <option value="pcs">Pieces (pcs)</option>
                                                <option value="kg">Kilograms (kg)</option>
                                                <option value="mtr">Meters (mtr)</option>
                                                <option value="box">Box</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all 
                                        ${editingId ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 'bg-[#0284c7] hover:bg-[#0369a1] shadow-blue-100'} 
                                        ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">Processing...</span>
                                        ) : (
                                            <>
                                                <Plus size={18} strokeWidth={3} />
                                                {editingId ? 'Update Product' : 'Add to Inventory'}
                                            </>
                                        )}
                                    </button>

                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="w-1/3 border border-gray-200 text-gray-600 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Product List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Table Header */}
                            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-lg text-gray-800">Product List</h2>
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{products.length}</span>
                                </div>

                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Barcode</th>
                                            <th className="px-6 py-4">Price</th>
                                            <th className="px-6 py-4">Unit</th>
                                            <th className="px-6 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 bg-white">
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                                        <Box size={48} className="mb-2 opacity-20" />
                                                        <p className="text-sm font-medium">No products found in inventory.</p>
                                                        <p className="text-xs mt-1">Add a new product to get started.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((product) => (
                                                <tr key={product._id} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-gray-800 text-sm mb-0.5">{product.name}</p>
                                                        {product.hsnCode && <p className="text-[10px] text-gray-400 font-mono">HSN: {product.hsnCode}</p>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                            {product.barcode || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                                                        ₹{Number(product.defaultPrice).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase">{product.unit}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEdit(product)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit Product"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(product._id)}
                                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Product"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer / Pagination */}
                            <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                                <span className="font-medium">Showing {products.length} all items</span>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 transition disabled:opacity-50 font-medium bg-white">
                                        Previous
                                    </button>
                                    <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 transition disabled:opacity-50 font-medium bg-white">
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProductPage;
