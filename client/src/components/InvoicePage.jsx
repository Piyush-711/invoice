import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Save, Users, Scan, ShoppingBag, ArrowLeft, Printer, FileText, Calendar } from 'lucide-react';
import ScannerModal from './ScannerModal';
import API_BASE_URL from '../config';

const InvoicePage = () => {
    const navigate = useNavigate();
    const [isIGST, setIsIGST] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const scannerBuffer = useRef("");
    const lastKeyTime = useRef(Date.now());

    const { register, control, handleSubmit, setValue, watch, getValues, formState: { errors } } = useForm({
        defaultValues: {
            customerName: '',
            job: '',
            mobileNumber: '',
            invoiceNo: '', // Will be populated by useEffect
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
            items: [
                { description: '', qty: 1, hsnCode: '', unitPrice: 0 }
            ],
            gstin: '',
            address: '',
            // New fields for Shipping/Transport
            shippingName: '',
            shippingAddress: '',
            shippingGstin: '',
            shippingState: '',
            shippingStateCode: '',
            shippingMob: ''
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    // Fetch next invoice number on mount
    useEffect(() => {
        const fetchNextInvoiceNumber = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/invoice/next-number`);
                if (response.data && response.data.nextInvoiceNo) {
                    const formattedNo = String(response.data.nextInvoiceNo).padStart(2, '0');
                    setValue('invoiceNo', formattedNo);
                }
            } catch (error) {
                console.error("Error fetching next invoice number:", error);
            }
        };
        fetchNextInvoiceNumber();
    }, [setValue]);

    // Handle Product Scanning (Camera + Hardware)
    // Handle Product Scanning (Camera + Hardware)
    const handleScan = React.useCallback(async (code) => {
        if (!code) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/products/fetch/${code}`);

            if (response.data) {
                const product = response.data;

                // Close scanner on success
                setShowScanner(false);

                // Use getValues to check current items to avoid stale 'fields' or closure issues
                const currentItems = getValues('items');
                const lastIndex = currentItems.length - 1;
                const lastItem = currentItems[lastIndex];

                const isLastItemEmpty = lastItem && !lastItem.description && !lastItem.hsnCode && (Number(lastItem.unitPrice) === 0);

                const newItem = {
                    description: product.name,
                    qty: 1,
                    hsnCode: product.hsnCode || '',
                    unitPrice: product.defaultPrice
                };

                if (isLastItemEmpty) {
                    // Update the empty row using setValue
                    // Note: setValue works, but ensure UI updates. 
                    setValue(`items.${lastIndex}`, newItem);
                } else {
                    // Append new row
                    append(newItem);
                }
            }
        } catch (error) {
            console.error("Product not found:", error);
            // Non-blocking feedback
        }
    }, [getValues, setValue, append]);

    // Keyboard Scanner Listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            const currentTime = Date.now();
            const char = e.key;

            // If time between keystrokes is more than 50ms, it's likely manual typing -> reset buffer
            if (currentTime - lastKeyTime.current > 50) {
                scannerBuffer.current = "";
            }

            lastKeyTime.current = currentTime;

            if (char === "Enter") {
                if (scannerBuffer.current.length > 3) {
                    // Trigger scan with buffered code
                    handleScan(scannerBuffer.current);
                    scannerBuffer.current = "";
                    e.preventDefault(); // Prevent default enter behavior (form submit)
                }
            } else if (char.length === 1) {
                scannerBuffer.current += char;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleScan]);



    const items = useWatch({
        control,
        name: "items"
    });

    // Calculations
    const calculateTotals = () => {
        let subTotal = 0;
        items.forEach(item => {
            const total = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
            subTotal += total;
        });

        const taxRate = 0.18;
        const halfTaxRate = 0.09;

        let sgst = 0;
        let cgst = 0;
        let igst = 0;
        let totalTax = 0;

        if (isIGST) {
            igst = subTotal * taxRate;
            totalTax = igst;
        } else {
            sgst = subTotal * halfTaxRate;
            cgst = subTotal * halfTaxRate;
            totalTax = sgst + cgst;
        }

        const grandTotal = subTotal + totalTax;

        return { subTotal, sgst, cgst, igst, totalTax, grandTotal };
    };

    const { subTotal, sgst, cgst, igst, totalTax, grandTotal } = calculateTotals();

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                items: data.items.map(item => ({
                    ...item,
                    total: (item.qty * item.unitPrice)
                })),
                totalAmount: grandTotal,
                purchaseDate: data.invoiceDate
            };

            const response = await axios.post(`${API_BASE_URL}/invoice`, payload);
            if (response.data) {
                setTimeout(() => {
                    window.print();
                    navigate(`/payment/${response.data._id}`);
                }, 500);
            }
        } catch (error) {
            console.error("Error saving invoice", error);
            alert("Failed to save invoice");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center invoice-wrapper">
            {/* Navigation Header */}
            <header className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center print-hidden sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-gray-500 hover:text-gray-700 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">New Invoice</h1>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/customers"
                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all shadow-sm active:scale-95 font-medium text-sm"
                    >
                        <Users size={16} />
                        View All Customers
                    </Link>

                </div>
            </header>

            {/* A4 Container Wrapper */}
            <div className="flex-1 w-full flex justify-center p-8 overflow-auto">
                <div className="bg-white w-[210mm] min-h-[297mm] p-8 shadow-2xl relative invoice-container flex flex-col">
                    <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col flex-1">


                        {/* Header */}
                        <div className="flex justify-between items-start border-b-2 border-gray-300 pb-1 mb-1">
                            {/* Left Side: Company Info */}
                            <div className="w-[60%]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-10 h-10 bg-blue-800 rounded-tl-xl rounded-br-xl"></div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-blue-900 uppercase leading-none">Shri Ambika Sales</h1>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-700 leading-relaxed font-serif pl-1">
                                    <p>Purani Kachari Market, Near Dujod Gate, Ghantaghar, Sikar, Rajasthan – 332001</p>
                                    <p className="mt-1 font-bold">Mobile No.: 9982134653, 9352002595</p>
                                    <p className="mt-1">Email: shriambikasales55@gmail.com</p>
                                    <p className="mt-2 font-bold text-gray-800">Authorised Dealer of Mettler, Contech, JBC Electronic Weighing Balances, Luminous Inverters, Batteries, etc.</p>
                                </div>
                            </div>

                            {/* Right Side: Invoice Details */}
                            <div className="w-[40%] text-sm">
                                <div className="flex items-center border-b border-gray-300 py-1">
                                    <span className="w-24 font-semibold text-gray-600">GSTIN:</span>
                                    <span className="flex-1 font-bold text-gray-800 text-right">08ACVPL7488JZZ</span>
                                </div>
                                <div className="flex items-center border-b border-gray-300 py-1">
                                    <span className="w-24 font-semibold text-gray-600">Invoice No:</span>
                                    <input {...register('invoiceNo')} className="flex-1 font-bold text-right focus:outline-none bg-transparent" />
                                </div>
                                <div className="flex items-center border-b border-gray-300 py-1">
                                    <span className="w-24 font-semibold text-gray-600">Invoice Date:</span>
                                    <input type="date" {...register('invoiceDate')} className="flex-1 text-right focus:outline-none bg-transparent" />
                                </div>
                                <div className="flex items-center border-b border-gray-300 py-1">
                                    <span className="w-24 font-semibold text-gray-600">Due Date:</span>
                                    <input type="date" {...register('dueDate')} className="flex-1 text-right focus:outline-none bg-transparent" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-center font-bold text-gray-800 uppercase my-1 tracking-wider" style={{ fontSize: '13px' }}>Tax Invoice</h2>

                        {/* Main Info Section (Bill To + Shipping/Invoice Details) */}
                        <div className="flex border-t border-b border-gray-800 border-2 mb-4">

                            {/* Left Side: Bill To */}
                            <div className="w-1/2 p-2 border-r-2 border-gray-800">
                                <h3 className="font-bold text-gray-800 mb-2 border-b border-gray-400 pb-1">Bill To:</h3>

                                <div className="flex flex-col gap-3">
                                    <input {...register('customerName', { required: true })} placeholder="Customer Name" className="w-full font-bold text-lg border-b border-gray-300 focus:outline-none placeholder-gray-400" />
                                    <textarea {...register('address')} placeholder="Address" className="w-full text-sm resize-none border-b border-gray-300 focus:outline-none h-16 placeholder-gray-400"></textarea>
                                    <input {...register('mobileNumber', { required: true })} placeholder="Mobile Number" className="w-full text-sm border-b border-gray-300 focus:outline-none placeholder-gray-400" />

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-700 w-16">GSTIN:</span>
                                        <input {...register('gstin')} placeholder="Customer GSTIN" className="flex-1 text-sm border-b border-gray-300 focus:outline-none uppercase" />
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Shipping & Invoice Details (Replicating Image) */}
                            <div className="w-1/2 text-sm">

                                {/* Shipping Details Block */}
                                <div className="bg-gray-50 h-full">
                                    <div className="p-1 font-bold border-b border-gray-400">Shipping Details :</div>

                                    <div className="p-1 flex items-center gap-2">
                                        <span className="w-16">Name</span>
                                        <input {...register('shippingName')} className="flex-1 border-b border-gray-300 focus:outline-none bg-transparent" />
                                    </div>
                                    <div className="p-1 flex items-center gap-2">
                                        <span className="w-16">Address</span>
                                        <input {...register('shippingAddress')} className="flex-1 border-b border-gray-300 focus:outline-none bg-transparent" />
                                    </div>
                                    <div className="p-1 flex items-center gap-2">
                                        <span className="w-16">GSTIN :</span>
                                        <input {...register('shippingGstin')} className="flex-1 border-b border-gray-300 focus:outline-none bg-transparent uppercase" />
                                    </div>
                                    <div className="p-1 flex items-center gap-2">
                                        <span className="w-16">STATE</span>
                                        <input {...register('shippingState')} className="flex-1 border-b border-gray-300 focus:outline-none bg-transparent" />
                                        <span className="w-24 text-right">STATE CODE</span>
                                        <input {...register('shippingStateCode')} className="w-12 border-b border-gray-300 focus:outline-none bg-transparent text-center" />
                                    </div>
                                    <div className="p-1 flex items-center gap-2 border-b border-gray-800">
                                        <span className="w-16">Mob.:</span>
                                        <input {...register('shippingMob')} className="flex-1 border-b border-gray-300 focus:outline-none bg-transparent" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-4 flex-grow">
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-[#005f73] text-white">
                                    <tr>
                                        <th className="py-2 px-3 text-center w-12 font-bold text-xs uppercase tracking-wider">S.No</th>
                                        <th className="py-2 px-3 text-left font-bold text-xs uppercase tracking-wider">Description of Goods</th>
                                        <th className="py-2 px-3 text-center w-20 font-bold text-xs uppercase tracking-wider">HSN</th>
                                        <th className="py-2 px-3 text-center w-16 font-bold text-xs uppercase tracking-wider">Qty</th>
                                        <th className="py-2 px-3 text-right w-24 font-bold text-xs uppercase tracking-wider">Rate</th>
                                        <th className="py-2 px-3 text-right w-28 font-bold text-xs uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map((item, index) => (
                                        <tr key={item.id} className="border-b border-gray-100 last:border-b-2 last:border-[#005f73]">
                                            <td className="p-3 text-center text-gray-400 text-xs font-semibold bg-gray-50/50">{index + 1}</td>
                                            <td className="p-2">
                                                <textarea
                                                    {...register(`items.${index}.description`)}
                                                    className="w-full h-10 resize-none focus:outline-none bg-transparent text-gray-800 placeholder-gray-300 font-medium leading-tight pt-2"
                                                    placeholder="Item Description"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <input
                                                    {...register(`items.${index}.hsnCode`)}
                                                    className="w-full text-center focus:outline-none bg-transparent text-gray-600 font-mono text-xs"
                                                    placeholder="-"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="number"
                                                    {...register(`items.${index}.qty`)}
                                                    className="w-full text-center focus:outline-none bg-transparent font-bold text-gray-800"
                                                />
                                            </td>
                                            <td className="p-2 text-right">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`items.${index}.unitPrice`)}
                                                    className="w-full text-right focus:outline-none bg-transparent font-medium text-gray-800"
                                                />
                                            </td>
                                            <td className="p-2 text-right font-bold text-gray-900 group relative">
                                                ₹{((watch(`items.${index}.qty`) || 0) * (watch(`items.${index}.unitPrice`) || 0)).toFixed(2)}
                                                <button
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="absolute -right-6 top-1/2 -translate-y-1/2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all print-hidden p-2"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex gap-4 mt-3 print-hidden">
                                <button type="button" onClick={() => append({ description: '', qty: 1, unitPrice: 0 })} className="flex items-center gap-1.5 text-[#0284c7] text-sm font-bold hover:text-blue-800 transition-colors">
                                    <div className="bg-[#0284c7] text-white rounded-full p-0.5"><Plus size={12} /></div> Add Item
                                </button>
                                <button type="button" onClick={() => setShowScanner(true)} className="flex items-center gap-1.5 text-purple-600 text-sm font-bold hover:text-purple-800 transition-colors">
                                    <Scan size={16} /> Scan Barcode / QR
                                </button>
                            </div>
                        </div>

                        {/* Bank & Totals Section */}
                        <div className="flex justify-between items-start mt-auto pt-6 border-t border-gray-200 gap-8 h-[300px]">
                            {/* Left: Bank Details & Terms */}
                            <div className="w-1/2 text-xs text-gray-600 space-y-4">
                                <div>
                                    <h4 className="font-bold text-gray-500 uppercase mb-2 tracking-wide text-[10px]">Bank Details</h4>
                                    <div className="grid grid-cols-[80px_1fr] gap-y-1">
                                        <span className="font-medium text-gray-500">Bank Name:</span>
                                        <span className="font-bold text-gray-800">Bank of Baroda</span>

                                        <span className="font-medium text-gray-500">A/C No:</span>
                                        <span className="font-bold text-gray-800">24412000006709</span>

                                        <span className="font-medium text-gray-500">IFSC:</span>
                                        <span className="font-bold text-gray-800">BARB0DEVS1K</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-500 uppercase mb-2 tracking-wide text-[10px]">Terms & Conditions</h4>
                                    <ol className="list-decimal pl-3 space-y-0.5 text-[10px]">
                                        <li>Goods once sold will not be taken back.</li>
                                        <li>Interest @ 18% p.a. will be charged if payment is not made within due date.</li>
                                        <li>Subject to Sikar Jurisdiction only.</li>
                                    </ol>
                                </div>
                            </div>

                            {/* Right: Totals & Signature */}
                            <div className="w-1/2 flex flex-col justify-between h-full">
                                <div>
                                    {/* IGST Toggle */}
                                    <div className="mb-3 print-hidden flex justify-end items-center gap-2">
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="toggle" id="igstToggle" checked={isIGST} onChange={(e) => setIsIGST(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-[#0284c7]" style={{ right: isIGST ? '0' : 'auto', left: isIGST ? 'auto' : '0' }} />
                                            <label htmlFor="igstToggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${isIGST ? 'bg-[#0284c7]' : 'bg-gray-300'}`}></label>
                                        </div>
                                        <label htmlFor="igstToggle" className="text-xs font-semibold cursor-pointer text-gray-500">Enable IGST (18%)</label>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Total Amount Before Tax:</span>
                                            <span className="font-bold text-gray-800">₹{subTotal.toFixed(2)}</span>
                                        </div>

                                        {!isIGST ? (
                                            <>
                                                <div className="flex justify-between text-gray-600">
                                                    <span>CGST @ 9%:</span>
                                                    <span className="font-medium">₹{cgst.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-600">
                                                    <span>SGST @ 9%:</span>
                                                    <span className="font-medium">₹{sgst.toFixed(2)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex justify-between text-gray-600">
                                                <span>IGST @ 18%:</span>
                                                <span className="font-medium">₹{igst.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between pt-2 border-t border-gray-200">
                                            <span className="font-bold text-gray-600">Total Tax Amount:</span>
                                            <span className="font-bold text-gray-800">₹{totalTax.toFixed(2)}</span>
                                        </div>

                                        <div className="flex justify-between items-center py-2 mt-2 border-t border-blue-900 border-b-2">
                                            <span className="text-sm font-bold text-[#0284c7] uppercase">Total Amount After Tax:</span>
                                            <span className="text-xl font-extrabold text-[#0284c7]">₹{grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center mt-6">
                                    <p className="font-bold text-xs text-gray-800 mb-8">For, Shri Ambika Sales</p>
                                    <div className="h-px bg-gray-300 w-3/4 mx-auto mb-1"></div>
                                    <p className="text-[10px] text-[#0284c7] italic font-medium">Authorized Signature</p>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="w-full bg-white border-t border-gray-200 p-4 sticky bottom-0 z-40 print-hidden">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className="text-sm font-bold text-orange-500">Draft</span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={handleSubmit(onSubmit)}
                            className="flex items-center gap-2 px-6 py-2 bg-[#0284c7] text-white font-bold rounded-lg hover:bg-[#0369a1] transition-colors shadow-sm text-sm"
                        >
                            <Printer size={16} /> Save & Print
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
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
                        min-height: 0 !important;
                        height: auto !important;
                    }
                    .invoice-container {
                        width: 210mm !important;
                        height: 297mm !important;
                        min-height: 0 !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 5mm !important;
                        overflow: hidden !important; /* Prevent spillover */
                    }
                    .print-hidden {
                        display: none !important;
                    }
                    /* Ensure form takes full height but doesn't overflow */
                    form {
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                    }
                }
            `}</style>
            {showScanner && (
                <ScannerModal
                    onClose={() => setShowScanner(false)}
                    onScanSuccess={handleScan}
                />
            )}
        </div>
    );
};

export default InvoicePage;
