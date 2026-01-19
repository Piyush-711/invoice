import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Save, Users, Scan, ShoppingBag } from 'lucide-react';
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
            <header className="w-full bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center print-hidden sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                    <span className="text-xl font-bold text-gray-800 tracking-tight">Shri Ambika Sales</span>
                </div>
                <Link
                    to="/customers"
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all shadow-md active:scale-95"
                >
                    <Users size={18} />
                    <span className="font-medium">View All Customers</span>
                </Link>
                <Link
                    to="/add-product"
                    className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-all shadow-md active:scale-95 ml-2"
                >
                    <ShoppingBag size={18} />
                    <span className="font-medium">Add Product</span>
                </Link>
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
                            <table className="w-full border-collapse border border-blue-900 text-sm">
                                <thead className="bg-blue-900 text-white">
                                    <tr>
                                        <th className="border border-blue-800 py-2 px-1 w-10">S.No</th>
                                        <th className="border border-blue-800 py-2 px-2 text-left">Description</th>
                                        <th className="border border-blue-800 py-2 px-1 w-12">Qty</th>
                                        <th className="border border-blue-800 py-2 px-1 w-16">HSN</th>
                                        <th className="border border-blue-800 py-2 px-2 text-right w-20">Rate</th>
                                        <th className="border border-blue-800 py-2 px-2 text-right w-24">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map((item, index) => (
                                        <tr key={item.id} className="border-b border-gray-200">
                                            <td className="border-r border-gray-300 p-2 text-center bg-gray-50">{index + 1}</td>
                                            <td className="border-r border-gray-300 p-2">
                                                <textarea
                                                    {...register(`items.${index}.description`)}
                                                    className="w-full h-16 resize-none focus:outline-none bg-transparent"
                                                    placeholder="Item Description"
                                                />
                                            </td>
                                            <td className="border-r border-gray-300 p-2 text-center">
                                                <input
                                                    type="number"
                                                    {...register(`items.${index}.qty`)}
                                                    className="w-full text-center focus:outline-none bg-transparent"
                                                />
                                            </td>
                                            <td className="border-r border-gray-300 p-2 text-center">
                                                <input
                                                    {...register(`items.${index}.hsnCode`)}
                                                    className="w-full text-center focus:outline-none bg-transparent"
                                                />
                                            </td>
                                            <td className="border-r border-gray-300 p-2 text-right">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`items.${index}.unitPrice`)}
                                                    className="w-full text-right focus:outline-none bg-transparent"
                                                />
                                            </td>
                                            <td className="p-2 text-right font-semibold">
                                                ₹{((watch(`items.${index}.qty`) || 0) * (watch(`items.${index}.unitPrice`) || 0)).toFixed(2)}
                                            </td>
                                            <td className="p-1 print-hidden w-6 text-center">
                                                <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex gap-2 mt-2 print-hidden">
                                <button type="button" onClick={() => append({ description: '', qty: 1, unitPrice: 0 })} className="flex items-center gap-1 text-blue-600 text-sm font-semibold hover:text-blue-800">
                                    <Plus size={16} /> Add Item
                                </button>
                                <button type="button" onClick={() => setShowScanner(true)} className="flex items-center gap-1 text-purple-600 text-sm font-semibold hover:text-purple-800">
                                    <Scan size={16} /> Scan Barcode / QR
                                </button>
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div className="flex justify-end mb-6">
                            <div className="w-1/2">
                                {/* IGST Toggle */}
                                <div className="mb-2 print-hidden flex justify-end items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="igstToggle"
                                        checked={isIGST}
                                        onChange={(e) => setIsIGST(e.target.checked)}
                                        className="w-4 h-4 cursor-pointer"
                                    />
                                    <label htmlFor="igstToggle" className="text-sm font-semibold cursor-pointer select-none">Enable IGST (18%)</label>
                                </div>

                                <div className="flex justify-between py-1 border-b border-gray-200">
                                    <span className="text-gray-600">Total Amount Before Tax:</span>
                                    <span className="font-semibold">₹{subTotal.toFixed(2)}</span>
                                </div>

                                {!isIGST && (
                                    <>
                                        <div className="flex justify-between py-1 border-b border-gray-200">
                                            <span className="text-gray-600">SGST @ 9%:</span>
                                            <span className="font-semibold">₹{sgst.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-200">
                                            <span className="text-gray-600">CGST @ 9%:</span>
                                            <span className="font-semibold">₹{cgst.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}
                                {isIGST && (
                                    <div className="flex justify-between py-1 border-b border-gray-200">
                                        <span className="text-gray-600">IGST @ 18%:</span>
                                        <span className="font-semibold">₹{igst.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between py-1 border-b border-blue-900 bg-gray-100 font-bold text-gray-800">
                                    <span className="pl-2">Total Tax Amount:</span>
                                    <span>₹{totalTax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b-2 border-blue-900 text-xl font-bold text-blue-900 bg-blue-50">
                                    <span className="pl-2">Total Amount After Tax:</span>
                                    <span>₹{grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-700 w-1/2">
                                <h4 className="font-bold mb-2">Payment Details</h4>
                                <p><span className="font-semibold">Bank Name:</span> Bank of Baroda</p>
                                <p><span className="font-semibold">A/C No:</span> 24412000006709</p>
                                <p><span className="font-semibold">IFSC Code:</span> BARBODE VSIK</p>

                                <div className="mt-4">
                                    <p className="font-bold">Terms: <span className="font-normal">Net 30 days</span></p>
                                    <p className="text-xs mt-1 text-gray-500">Thank you for your business! Please remit payment by due date.</p>
                                </div>
                            </div>
                            <div className="w-1/3 text-center">
                                <p className="font-bold text-lg mb-8">For, Shri Ambika Sales</p>
                                <div className="h-10 border-b border-gray-400 w-3/4 mx-auto mb-2 relative">
                                    <div className="absolute bottom-1 left-0 right-0 text-blue-900 font-handwriting italic text-xl">Authorized Signature</div>
                                </div>
                                <p className="text-xs text-gray-500">Authorized Signature</p>
                            </div>
                        </div>

                        {/* Floating Action Buttons */}
                        <div className="fixed bottom-8 right-8 flex gap-4 print-hidden">

                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors font-bold"
                            >
                                <Save size={20} /> Save & Print
                            </button>
                        </div>

                    </form>
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
            </div>
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
