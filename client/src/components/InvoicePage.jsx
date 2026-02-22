import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Users, Scan, ArrowLeft, Printer, ChevronLeft } from 'lucide-react';
import ScannerModal from './ScannerModal';
import API_BASE_URL from '../config';

const InvoicePage = () => {
    const navigate = useNavigate();
    const [isIGST, setIsIGST] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const scannerBuffer = useRef('');
    const lastKeyTime = useRef(Date.now());

    const { register, control, handleSubmit, setValue, watch, getValues } = useForm({
        defaultValues: {
            customerName: '',
            job: '',
            mobileNumber: '',
            invoiceNo: '',
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
            items: [{ description: '', qty: 1, hsnCode: '', unitPrice: 0 }],
            gstin: '',
            address: '',
            shippingName: '',
            shippingAddress: '',
            shippingGstin: '',
            shippingState: '',
            shippingStateCode: '',
            shippingMob: ''
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'items' });

    useEffect(() => {
        const fetchNextInvoiceNumber = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/invoice/next-number`);
                if (response.data?.nextInvoiceNo) {
                    setValue('invoiceNo', String(response.data.nextInvoiceNo).padStart(2, '0'));
                }
            } catch (error) {
                console.error('Error fetching next invoice number:', error);
            }
        };
        fetchNextInvoiceNumber();
    }, [setValue]);

    const handleScan = React.useCallback(async (code) => {
        if (!code) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/products/fetch/${code}`);
            if (response.data) {
                const product = response.data;
                setShowScanner(false);
                const currentItems = getValues('items');
                const lastIndex = currentItems.length - 1;
                const lastItem = currentItems[lastIndex];
                const isLastItemEmpty = lastItem && !lastItem.description && !lastItem.hsnCode && Number(lastItem.unitPrice) === 0;
                const newItem = { description: product.name, qty: 1, hsnCode: product.hsnCode || '', unitPrice: product.defaultPrice };
                if (isLastItemEmpty) {
                    setValue(`items.${lastIndex}`, newItem);
                } else {
                    append(newItem);
                }
            }
        } catch (error) {
            console.error('Product not found:', error);
        }
    }, [getValues, setValue, append]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const currentTime = Date.now();
            const char = e.key;
            if (currentTime - lastKeyTime.current > 50) scannerBuffer.current = '';
            lastKeyTime.current = currentTime;
            if (char === 'Enter') {
                if (scannerBuffer.current.length > 3) {
                    handleScan(scannerBuffer.current);
                    scannerBuffer.current = '';
                    e.preventDefault();
                }
            } else if (char.length === 1) {
                scannerBuffer.current += char;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleScan]);

    const items = useWatch({ control, name: 'items' });

    const calculateTotals = () => {
        let subTotal = 0;
        items.forEach(item => { subTotal += (Number(item.qty) || 0) * (Number(item.unitPrice) || 0); });
        const taxRate = 0.18, halfTaxRate = 0.09;
        let sgst = 0, cgst = 0, igst = 0, totalTax = 0;
        if (isIGST) { igst = subTotal * taxRate; totalTax = igst; }
        else { sgst = subTotal * halfTaxRate; cgst = subTotal * halfTaxRate; totalTax = sgst + cgst; }
        return { subTotal, sgst, cgst, igst, totalTax, grandTotal: subTotal + totalTax };
    };

    const { subTotal, sgst, cgst, igst, totalTax, grandTotal } = calculateTotals();

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                items: data.items.map(item => ({ ...item, total: item.qty * item.unitPrice })),
                totalAmount: grandTotal,
                purchaseDate: data.invoiceDate
            };
            const response = await axios.post(`${API_BASE_URL}/invoice`, payload);
            if (response.data) {
                setTimeout(() => { window.print(); navigate(`/payment/${response.data._id}`); }, 500);
            }
        } catch (error) {
            console.error('Error saving invoice', error);
            alert('Failed to save invoice');
        }
    };

    return (
        <div className="min-h-screen flex flex-col invoice-wrapper" style={{ background: '#f1f5f9' }}>

            {/* ── Modern Toolbar ── */}
            <header className="print-hidden w-full sticky top-0 z-50 flex items-center justify-between px-6 py-3 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                        <ChevronLeft size={16} /> Dashboard
                    </Link>
                    <div className="w-px h-5 bg-slate-700" />
                    <h1 className="text-white font-bold text-base">New Invoice</h1>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">Draft</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* IGST Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-slate-400 text-xs font-medium">IGST</span>
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={isIGST} onChange={e => setIsIGST(e.target.checked)} />
                            <div className={`w-9 h-5 rounded-full transition-colors ${isIGST ? 'bg-indigo-500' : 'bg-slate-600'}`} />
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isIGST ? 'translate-x-4' : ''}`} />
                        </div>
                    </label>

                    <button type="button" onClick={() => setShowScanner(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-600">
                        <Scan size={14} /> Scan
                    </button>

                    <button onClick={handleSubmit(onSubmit)}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-white text-sm font-bold rounded-lg transition-all shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                        <Printer size={15} /> Save & Print
                    </button>
                </div>
            </header>

            {/* ── A4 sheet ── */}
            <div className="flex-1 flex justify-center py-6 px-4 overflow-auto print:p-0 print:py-0">
                <div className="bg-white w-[210mm] shadow-2xl invoice-container print:shadow-none" style={{ minHeight: '297mm' }}>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full" style={{ padding: '6mm 8mm' }}>

                        {/* ── Invoice Header ── */}
                        <div className="flex justify-between items-start pb-1 mb-1 border-b-2 border-slate-700">
                            {/* Company */}
                            <div className="w-[58%]">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 rounded-tl-xl rounded-br-xl flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }} />
                                    <h1 className="text-2xl font-black text-blue-900 uppercase leading-none tracking-tight">Shri Ambika Sales</h1>
                                </div>
                                <div className="text-[10.5px] text-gray-600 leading-tight pl-1 space-y-0.5">
                                    <p>Purani Kachari Market, Near Dujod Gate, Ghantaghar, Sikar, Rajasthan – 332001</p>
                                    <p className="font-bold">Mob: 9982134653, 9352002595 &nbsp;|&nbsp; Email: shriambikasales55@gmail.com</p>
                                    <p className="font-semibold text-gray-700">Authorised Dealer of Mettler, Contech, JBC Electronic Weighing Balances, Luminous Inverters & Batteries</p>
                                </div>
                            </div>

                            {/* Invoice meta */}
                            <div className="w-[40%] text-[10.5px]">
                                <div className="border border-gray-300 rounded overflow-hidden">
                                    <div className="flex items-center px-2 py-0.5 border-b border-gray-200 bg-gray-50">
                                        <span className="w-20 font-semibold text-gray-500">GSTIN:</span>
                                        <span className="flex-1 font-bold text-gray-800 text-right">08ACVPL7488JZZ</span>
                                    </div>
                                    <div className="flex items-center px-2 py-0.5 border-b border-gray-200">
                                        <span className="w-20 font-semibold text-gray-500">Invoice No:</span>
                                        <input {...register('invoiceNo')} className="flex-1 font-bold text-right focus:outline-none bg-transparent" />
                                    </div>
                                    <div className="flex items-center px-2 py-0.5 border-b border-gray-200">
                                        <span className="w-20 font-semibold text-gray-500">Date:</span>
                                        <input type="date" {...register('invoiceDate')} className="flex-1 text-right focus:outline-none bg-transparent" />
                                    </div>
                                    <div className="flex items-center px-2 py-0.5">
                                        <span className="w-20 font-semibold text-gray-500">Due Date:</span>
                                        <input type="date" {...register('dueDate')} className="flex-1 text-right focus:outline-none bg-transparent" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-center font-extrabold text-gray-700 uppercase tracking-widest text-[10px] my-0.5">— Tax Invoice —</h2>

                        {/* ── Bill To + Shipping ── */}
                        <div className="flex border-2 border-gray-700 rounded text-[11px] mb-1.5">
                            {/* Bill To */}
                            <div className="w-1/2 p-1.5 border-r-2 border-gray-700">
                                <p className="font-extrabold text-gray-700 uppercase tracking-wider text-[9px] mb-1">Bill To</p>
                                <div className="space-y-0.5">
                                    <input {...register('customerName', { required: true })} placeholder="Customer Name *"
                                        className="w-full font-bold text-sm border-b border-gray-300 focus:outline-none placeholder-gray-300 pb-0.5" />
                                    <input {...register('address')} placeholder="Address"
                                        className="w-full border-b border-gray-200 focus:outline-none placeholder-gray-300 pb-0.5" />
                                    <div className="flex gap-2">
                                        <input {...register('mobileNumber', { required: true })} placeholder="Mobile *"
                                            className="flex-1 border-b border-gray-200 focus:outline-none placeholder-gray-300 pb-0.5" />
                                        <input {...register('gstin')} placeholder="GSTIN"
                                            className="flex-1 border-b border-gray-200 focus:outline-none uppercase placeholder-gray-300 pb-0.5" />
                                    </div>
                                </div>
                            </div>

                            {/* Shipping */}
                            <div className="w-1/2 p-1.5 bg-gray-50">
                                <p className="font-extrabold text-gray-700 uppercase tracking-wider text-[9px] mb-1">Shipping Details</p>
                                <div className="space-y-0.5">
                                    <div className="flex gap-1">
                                        <span className="w-10 text-gray-500 flex-shrink-0">Name</span>
                                        <input {...register('shippingName')} className="flex-1 border-b border-gray-200 focus:outline-none bg-transparent pb-0.5" />
                                    </div>
                                    <div className="flex gap-1">
                                        <span className="w-10 text-gray-500 flex-shrink-0">Addr.</span>
                                        <input {...register('shippingAddress')} className="flex-1 border-b border-gray-200 focus:outline-none bg-transparent pb-0.5" />
                                    </div>
                                    <div className="flex gap-1">
                                        <span className="w-10 text-gray-500 flex-shrink-0">GSTIN</span>
                                        <input {...register('shippingGstin')} className="flex-1 border-b border-gray-200 focus:outline-none bg-transparent uppercase pb-0.5" />
                                    </div>
                                    <div className="flex gap-1 items-center">
                                        <span className="w-10 text-gray-500 flex-shrink-0">State</span>
                                        <input {...register('shippingState')} className="flex-1 border-b border-gray-200 focus:outline-none bg-transparent pb-0.5" />
                                        <span className="text-gray-500 text-[8px] ml-1">Code</span>
                                        <input {...register('shippingStateCode')} className="w-8 border-b border-gray-200 focus:outline-none bg-transparent text-center pb-0.5 ml-1" />
                                    </div>
                                    <div className="flex gap-1">
                                        <span className="w-10 text-gray-500 flex-shrink-0">Mob.</span>
                                        <input {...register('shippingMob')} className="flex-1 border-b border-gray-200 focus:outline-none bg-transparent pb-0.5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Items Table ── */}
                        <div className="flex-grow overflow-visible">
                            <table className="w-full border-collapse" style={{ fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#0f172a', color: 'white' }}>
                                        <th className="py-1 px-1.5 text-center font-bold uppercase tracking-wide w-8">#</th>
                                        <th className="py-1 px-2 text-left font-bold uppercase tracking-wide">Description of Goods</th>
                                        <th className="py-1 px-1.5 text-center font-bold uppercase tracking-wide w-16">HSN</th>
                                        <th className="py-1 px-1.5 text-center font-bold uppercase tracking-wide w-12">Qty</th>
                                        <th className="py-1 px-1.5 text-right font-bold uppercase tracking-wide w-20">Rate (₹)</th>
                                        <th className="py-1 px-2 text-right font-bold uppercase tracking-wide w-24">Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map((item, index) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50/30 group">
                                            <td className="px-1.5 py-1 text-center text-gray-400 font-mono text-[11px] bg-gray-50/50">{index + 1}</td>
                                            <td className="px-2 py-1">
                                                <input
                                                    {...register(`items.${index}.description`)}
                                                    className="w-full focus:outline-none bg-transparent text-gray-800 placeholder-gray-300 font-medium leading-tight"
                                                    placeholder="Item description…"
                                                />
                                            </td>
                                            <td className="px-1.5 py-1 text-center">
                                                <input
                                                    {...register(`items.${index}.hsnCode`)}
                                                    className="w-full text-center focus:outline-none bg-transparent text-gray-500 font-mono"
                                                    placeholder="—"
                                                />
                                            </td>
                                            <td className="px-1.5 py-1 text-center">
                                                <input
                                                    type="number"
                                                    {...register(`items.${index}.qty`)}
                                                    className="w-full text-center focus:outline-none bg-transparent font-bold text-gray-800"
                                                />
                                            </td>
                                            <td className="px-1.5 py-1 text-right">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`items.${index}.unitPrice`)}
                                                    className="w-full text-right focus:outline-none bg-transparent font-medium text-gray-800"
                                                />
                                            </td>
                                            <td className="px-2 py-1 text-right font-bold text-gray-900 relative">
                                                {((watch(`items.${index}.qty`) || 0) * (watch(`items.${index}.unitPrice`) || 0)).toFixed(2)}
                                                <button
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="absolute -right-5 top-1/2 -translate-y-1/2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all print-hidden"
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Empty rows for visual continuity on print */}
                                    {Array.from({ length: Math.max(0, 6 - fields.length) }).map((_, i) => (
                                        <tr key={`empty-${i}`} className="border-b border-gray-50">
                                            <td className="px-1.5 py-1 text-center text-gray-200 text-[11px] bg-gray-50/30">{fields.length + i + 1}</td>
                                            <td className="px-2 py-1" /><td /><td /><td /><td />
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Add Item Actions */}
                            <div className="flex gap-4 mt-1 print-hidden">
                                <button type="button"
                                    onClick={() => append({ description: '', qty: 1, hsnCode: '', unitPrice: 0 })}
                                    className="flex items-center gap-1 text-indigo-600 text-[10px] font-bold hover:text-indigo-800 transition-colors">
                                    <div className="bg-indigo-600 text-white rounded-full p-0.5"><Plus size={10} /></div> Add Item
                                </button>
                                <button type="button" onClick={() => setShowScanner(true)}
                                    className="flex items-center gap-1 text-purple-600 text-[10px] font-bold hover:text-purple-800 transition-colors">
                                    <Scan size={12} /> Scan Barcode / QR
                                </button>
                            </div>
                        </div>

                        {/* ── Footer: Bank + Totals ── */}
                        <div className="mt-auto pt-1 border-t-2 border-slate-700">
                            <div className="flex gap-4">

                                {/* Bank Details + T&C */}
                                <div className="w-1/2 text-[10px] text-gray-600 space-y-2">
                                    <div>
                                        <h4 className="font-extrabold text-gray-500 uppercase tracking-widest text-[9px] mb-0.5">Bank Details</h4>
                                        <div className="grid grid-cols-[60px_1fr] gap-y-0.5">
                                            <span className="text-gray-500">Bank Name:</span><span className="font-bold text-gray-800">Bank of Baroda</span>
                                            <span className="text-gray-500">A/C No:</span><span className="font-bold text-gray-800">24412000006709</span>
                                            <span className="text-gray-500">IFSC:</span><span className="font-bold text-gray-800">BARB0DEVS1K</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-gray-500 uppercase tracking-widest text-[9px] mb-0.5">Terms & Conditions</h4>
                                        <ol className="list-decimal pl-3 space-y-0 text-[9px] text-gray-500">
                                            <li>Goods once sold will not be taken back.</li>
                                            <li>Interest @ 18% p.a. if payment not made by due date.</li>
                                            <li>Subject to Sikar Jurisdiction only.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* Totals + Signature */}
                                <div className="w-1/2 flex flex-col justify-between">
                                    <div className="text-[11px] space-y-0.5">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal (before tax)</span>
                                            <span className="font-bold text-gray-800">₹{subTotal.toFixed(2)}</span>
                                        </div>
                                        {!isIGST ? (
                                            <>
                                                <div className="flex justify-between text-gray-500">
                                                    <span>CGST @ 9%</span><span>₹{cgst.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-500">
                                                    <span>SGST @ 9%</span><span>₹{sgst.toFixed(2)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex justify-between text-gray-500">
                                                <span>IGST @ 18%</span><span>₹{igst.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t border-gray-200 pt-0.5 text-gray-600">
                                            <span className="font-bold">Total Tax</span>
                                            <span className="font-bold">₹{totalTax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t-2 border-slate-700 pt-1 mt-0.5">
                                            <span className="font-extrabold text-blue-900 text-[12px] uppercase tracking-wide">Grand Total</span>
                                            <span className="text-lg font-black text-blue-900">₹{grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="text-center mt-2">
                                        <p className="font-bold text-[10px] text-gray-700 mb-5">For, Shri Ambika Sales</p>
                                        <div className="h-px bg-gray-300 w-3/4 mx-auto mb-0.5" />
                                        <p className="text-[9px] text-blue-700 italic font-medium">Authorized Signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>
            </div>

            {/* Print styles */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .invoice-wrapper {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                    }
                    .invoice-container {
                        width: 210mm !important;
                        min-height: 297mm !important;
                        box-shadow: none !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                    }
                    .print-hidden { display: none !important; }
                    form { height: 100%; display: flex; flex-direction: column; }
                }
            `}</style>

            {showScanner && <ScannerModal onClose={() => setShowScanner(false)} onScanSuccess={handleScan} />}
        </div>
    );
};

export default InvoicePage;
