console.log("Debug script starting");
try {
    const express = require('express');
    console.log("Express loaded");
    const app = express();
    console.log("App created");
} catch (e) {
    console.error("Error:", e);
}
console.log("Debug script finished");
