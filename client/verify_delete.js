import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testDelete() {
    try {
        console.log("1. Creating a test invoice...");
        const invoiceRes = await axios.post(`${API_BASE_URL}/invoice`, {
            customerName: "Test Delete",
            mobileNumber: "9999999999",
            items: [],
            totalAmount: 100,
            invoiceNo: "TEST-DEL",
            dueDate: new Date().toISOString()
        });

        const invoiceId = invoiceRes.data._id;
        console.log("Invoice created with ID:", invoiceId);

        console.log("2. Verifying it exists in list...");
        const listRes1 = await axios.get(`${API_BASE_URL}/invoice`);
        const exists1 = listRes1.data.find(inv => inv._id === invoiceId);
        if (!exists1) {
            console.error("CRITICAL: Invoice not found in list immediately after creation!");
            // return; // Continue anyway to see if delete works on ID
        } else {
            console.log("Invoice found in list.");
        }

        console.log("3. Deleting invoice via API...");
        const deleteRes = await axios.delete(`${API_BASE_URL}/invoice/${invoiceId}`);
        console.log("Delete Response Status:", deleteRes.status);
        console.log("Delete Response Data:", deleteRes.data);

        console.log("4. Verifying it is GONE from list...");
        const listRes2 = await axios.get(`${API_BASE_URL}/invoice`);
        const exists2 = listRes2.data.find(inv => inv._id === invoiceId);

        if (exists2) {
            console.error("FAILURE: Invoice STILL EXISTS in backend list!");
        } else {
            console.log("SUCCESS: Invoice is gone from backend list.");
        }

    } catch (error) {
        console.error("Test Failed:", error.message);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", error.response.data);
        }
    }
}

testDelete();
