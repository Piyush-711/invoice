import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, ShoppingBag } from 'lucide-react';
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
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                        <ArrowLeft size={20} /> Back to Invoice
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingBag className="text-blue-600" />
                        product Management
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Form Section */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                            <h2 className="text-lg font-bold mb-4 border-b pb-2">
                                {editingId ? 'Edit Product' : 'Add New Product'}
                            </h2>

                            {statusMessage && (
                                <div className={`mb-4 p-3 rounded-md text-sm ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {statusMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {/* Barcode */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Barcode</label>
                                    <input
                                        {...register('barcode')}
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Scan/Type"
                                    />
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Name *</label>
                                    <input
                                        {...register('name', { required: "Required" })}
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Product Name"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                </div>

                                {/* Price & HSN */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Price *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('defaultPrice', { required: "Required", min: 0.1 })}
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                        {errors.defaultPrice && <p className="text-red-500 text-xs mt-1">Required</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">HSN</label>
                                        <input
                                            {...register('hsnCode')}
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Tax & Unit */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Tax (%)</label>
                                        <select
                                            {...register('taxRate')}
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        >
                                            <option value="0">0%</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Unit</label>
                                        <input
                                            {...register('unit')}
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`flex-1 flex justify-center items-center gap-2 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} ${isSubmitting ? 'opacity-70' : ''}`}
                                    >
                                        <Save size={16} />
                                        {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Add')}
                                    </button>

                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                <h2 className="font-bold text-gray-700">Product List ({products.length})</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Barcode</th>
                                            <th className="px-4 py-3 text-right">Price</th>
                                            <th className="px-4 py-3">Unit</th>
                                            <th className="px-4 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                    No products added yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((product) => (
                                                <tr key={product._id} className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{product.barcode || '-'}</td>
                                                    <td className="px-4 py-3 text-right font-bold">₹{product.defaultPrice}</td>
                                                    <td className="px-4 py-3 text-gray-500">{product.unit}</td>
                                                    <td className="px-4 py-3 flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="text-blue-600 hover:text-blue-900 font-medium text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product._id)}
                                                            className="text-red-600 hover:text-red-900 font-medium text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProductPage;
