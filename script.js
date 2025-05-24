document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const itemsBody = document.getElementById("items-body");
  const addItemBtn = document.getElementById("add-item");
  const taxInput = document.getElementById("tax");
  const discountInput = document.getElementById("discount");
  const grandTotalEl = document.getElementById("grand-total");

  const generateBtn = document.getElementById("generate-invoice");
  const previewSection = document.getElementById("invoice-preview");
  const previewContent = document.getElementById("preview-content");

  const searchSerialInput = document.getElementById("search-serial");
  const searchBtn = document.getElementById("search-btn");
  const searchMessage = document.getElementById("search-message");

  const printBtn = document.getElementById("print-invoice");
  const downloadBtn = document.getElementById("download-pdf");

  // Helper: Generate Unique Invoice ID
  function generateSerialNumber() {
    return "INV-" + Date.now();
  }

  // Add Item Row
  function addItemRow() {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><input type="text" class="desc" placeholder="Item Description" /></td>
      <td><input type="number" class="qty" value="1" min="1" /></td>
      <td><input type="number" class="price" value="0" min="0" step="0.01" /></td>
      <td class="total">0.00</td>
      <td><button class="remove-item" type="button">X</button></td>
    `;

    row.querySelector(".qty").addEventListener("input", updateTotals);
    row.querySelector(".price").addEventListener("input", updateTotals);
    row.querySelector(".remove-item").addEventListener("click", () => {
      row.remove();
      updateTotals();
      toggleGenerateButton();
    });

    itemsBody.appendChild(row);
    updateTotals();
    toggleGenerateButton();
  }

  // Update Totals
  function updateTotals() {
    let subtotal = 0;
    const currency = document.getElementById("currency").value;

    document.querySelectorAll("#items-body tr").forEach((row) => {
      const qty = parseFloat(row.querySelector(".qty").value) || 0;
      const price = parseFloat(row.querySelector(".price").value) || 0;
      const total = qty * price;

      row.querySelector(".total").innerText = total.toFixed(2);
      subtotal += total;
    });

    const tax = parseFloat(taxInput.value) || 0;
    const discount = parseFloat(discountInput.value) || 0;

    const taxAmount = (tax / 100) * subtotal;
    const discountAmount = (discount / 100) * subtotal;
    const grandTotal = subtotal + taxAmount - discountAmount;

    grandTotalEl.innerText = `${currency} ${grandTotal.toFixed(2)}`;
  }

  // Enable or Disable Generate Button based on item rows
  function toggleGenerateButton() {
    const hasItems = itemsBody.children.length > 0;
    generateBtn.disabled = !hasItems;
  }

  // Save Invoice & Display Preview
  generateBtn.addEventListener("click", () => {
    const clientName = document.getElementById("client-name").value.trim();
    const clientEmail = document.getElementById("client-email").value.trim();
    const clientPhone = document.getElementById("client-phone").value.trim();
    const clientAddress = document.getElementById("client-address").value.trim();
    const invoiceDate = document.getElementById("invoice-date").value;
    const dueDate = document.getElementById("due-date").value;
    const currency = document.getElementById("currency").value;
    const tax = parseFloat(taxInput.value) || 0;
    const discount = parseFloat(discountInput.value) || 0;

    if (!clientName || !invoiceDate || !dueDate) {
      alert("Please fill in at least Client Name, Invoice Date, and Due Date.");
      return;
    }

    let items = [];
    let subtotal = 0;

    let validItems = true;

    document.querySelectorAll("#items-body tr").forEach((row) => {
      const desc = row.querySelector(".desc").value.trim();
      const qty = parseFloat(row.querySelector(".qty").value) || 0;
      const price = parseFloat(row.querySelector(".price").value) || 0;

      if (!desc) {
        validItems = false;
        row.querySelector(".desc").focus();
      }

      const total = qty * price;
      items.push({ desc, qty, price, total });
      subtotal += total;
    });

    if (!validItems) {
      alert("Please fill all item descriptions.");
      return;
    }

    if (items.length === 0) {
      alert("Please add at least one invoice item.");
      return;
    }

    const taxAmount = (tax / 100) * subtotal;
    const discountAmount = (discount / 100) * subtotal;
    const grandTotal = subtotal + taxAmount - discountAmount;
    const serialNumber = generateSerialNumber();

    const invoiceData = {
      serialNumber,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      invoiceDate,
      dueDate,
      currency,
      tax,
      discount,
      items,
      subtotal,
      taxAmount,
      discountAmount,
      grandTotal,
    };

    localStorage.setItem(serialNumber, JSON.stringify(invoiceData));
    alert(`Invoice saved! Serial Number: ${serialNumber}`);
    displayInvoice(invoiceData);
  });

  // Display Invoice Preview
  function displayInvoice(data) {
    const itemsHTML = data.items
      .map(
        ({ desc, qty, price, total }) => `
      <tr>
        <td>${desc}</td>
        <td>${qty}</td>
        <td>${data.currency}${price.toFixed(2)}</td>
        <td>${data.currency}${total.toFixed(2)}</td>
      </tr>`
      )
      .join("");

    previewContent.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div style="flex: 1;">
          <img src="assets/logo.png" alt="Logo" style="height: 60px;" />
        </div>
        <div style="flex: 2; text-align: center;">
          <h2 style="margin: 0;">Lion Enterprises</h2>
          <p style="margin: 2px 0;">Add: XYZ, Jharkhand 473894</p>
          <p style="margin: 2px 0;">Contact: +91 952305XXXX</p>
        </div>
        <div style="flex: 1;"></div>
      </div>

      <p><strong>Invoice #:</strong> ${data.serialNumber}</p>
      <p><strong>Client:</strong> ${data.clientName} | ${data.clientEmail} | ${data.clientPhone}</p>
      <p><strong>Address:</strong> ${data.clientAddress}</p>
      <p><strong>Invoice Date:</strong> ${data.invoiceDate} | <strong>Due:</strong> ${data.dueDate}</p>

      <table border="1" width="100%" cellspacing="0" cellpadding="5" style="border-collapse: collapse;">
        <thead>
          <tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>

      <p><strong>Subtotal:</strong> ${data.currency}${data.subtotal.toFixed(2)}</p>
      <p><strong>Tax (${data.tax}%):</strong> ${data.currency}${data.taxAmount.toFixed(2)}</p>
      <p><strong>Discount (${data.discount}%):</strong> -${data.currency}${data.discountAmount.toFixed(2)}</p>
      <h3>Total: ${data.currency}${data.grandTotal.toFixed(2)}</h3>
    `;

    previewSection.style.display = "block";
  }

  // Search Invoice by Serial Number
  searchBtn.addEventListener("click", () => {
    const serial = searchSerialInput.value.trim();
    searchMessage.style.display = "none";
    previewSection.style.display = "none";

    if (!serial) {
      alert("Please enter an invoice serial number to search.");
      return;
    }

    const invoiceDataStr = localStorage.getItem(serial);
    if (!invoiceDataStr) {
      searchMessage.style.display = "block";
      searchMessage.textContent = "No invoice found with that serial number.";
      return;
    }

    const invoiceData = JSON.parse(invoiceDataStr);
    displayInvoice(invoiceData);
  });

  // Print Invoice
  document.getElementById('print-invoice').addEventListener('click', () => {
  window.print();
});


  // Initial Setup
  addItemBtn.addEventListener("click", addItemRow);
  taxInput.addEventListener("input", updateTotals);
  discountInput.addEventListener("input", updateTotals);
  document.getElementById("currency").addEventListener("change", updateTotals);

  toggleGenerateButton();
});
