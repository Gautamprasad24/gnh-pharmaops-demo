// Change this if your backend runs on another port/host
// const API_BASE = "http://localhost:4000";
const API_BASE = "https://YOUR-BACKEND.onrender.com";

let stockPieChart = null;
let orderStatusChart = null;

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  return res.json();
}

async function loadDashboard() {
  try {
    const [medicines, orders] = await Promise.all([
      fetchJSON(`${API_BASE}/api/medicines`),
      fetchJSON(`${API_BASE}/api/orders`)
    ]);

    renderMedicines(medicines);
    renderOrders(orders);
    updateCards(medicines, orders);
    renderStockPieChart(medicines);
    renderOrderStatusChart(orders);

  } catch (err) {
    console.error("Error loading dashboard:", err);
    alert("Failed to load data from API. Check if backend is running.");
  }
}
function renderStockPieChart(medicines) {
  const categoryMap = {};

  medicines.forEach((m) => {
    const category = m.category || "Others";
    categoryMap[category] = (categoryMap[category] || 0) + m.stock;
  });

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);

  const ctx = document.getElementById("stockPieChart");

  if (stockPieChart) {
    stockPieChart.destroy();
  }

  stockPieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#2563eb",
            "#16a34a",
            "#ea580c",
            "#9333ea",
            "#dc2626"
          ]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}
function renderOrderStatusChart(orders) {
  const statusCount = {
    Pending: 0,
    Dispatched: 0,
    Cancelled: 0
  };

  orders.forEach((o) => {
    statusCount[o.status] = (statusCount[o.status] || 0) + 1;
  });

  const ctx = document.getElementById("orderStatusChart");

  if (orderStatusChart) {
    orderStatusChart.destroy();
  }

  orderStatusChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(statusCount),
      datasets: [
        {
          label: "Orders",
          data: Object.values(statusCount),
          backgroundColor: "#2563eb"
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}


function renderMedicines(medicines) {
  const tbody = document.getElementById("medicines-table-body");
  tbody.innerHTML = "";

  medicines.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.name}</td>
      <td>${m.batchNo}</td>
      <td>${m.stock}</td>
      <td>${m.expiryDate}</td>
      <td>${m.category || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderOrders(orders) {
  const tbody = document.getElementById("orders-table-body");
  tbody.innerHTML = "";

  orders.forEach((o) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${o.hospital}</td>
      <td>${o.medicineName}</td>
      <td>${o.quantity}</td>
      <td>
        <select onchange="handleStatusChange(${o.id}, this.value)">
          <option value="Pending"   ${o.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Dispatched" ${o.status === "Dispatched" ? "selected" : ""}>Dispatched</option>
          <option value="Cancelled" ${o.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </td>
    `;

    tbody.appendChild(tr);
  });
}
async function handleStatusChange(orderId, newStatus) {
  try {
    await fetchJSON(`${API_BASE}/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });

    // Reload dashboard so:
    // - Orders table updates
    // - Order status bar chart updates live
    loadDashboard();
  } catch (err) {
    console.error("Error updating order status:", err);
    alert("Failed to update order status.");
  }
}


function updateCards(medicines, orders) {
  document.getElementById("total-medicines").textContent = medicines.length;
  document.getElementById("total-orders").textContent = orders.filter(
    (o) => o.status === "Pending"
  ).length;

  // Count high risk (expiry within 90 days) on client side
  const today = new Date();
  let highRiskCount = 0;

  medicines.forEach((m) => {
    const exp = new Date(m.expiryDate);
    const diffMs = exp - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 90) highRiskCount++;
  });

  document.getElementById("high-risk-count").textContent = highRiskCount;
}

function initForms() {
  const medForm = document.getElementById("medicine-form");
  const medStatus = document.getElementById("med-form-status");

  medForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    medStatus.textContent = "";
    medStatus.className = "form-status";

    const payload = {
      name: document.getElementById("med-name").value.trim(),
      batchNo: document.getElementById("med-batch").value.trim(),
      stock: document.getElementById("med-stock").value,
      expiryDate: document.getElementById("med-expiry").value,
      category: document.getElementById("med-category").value.trim()
    };

    try {
      await fetchJSON(`${API_BASE}/api/medicines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      medStatus.textContent = "Medicine saved successfully.";
      medStatus.classList.add("success");
      medForm.reset();
      loadDashboard();
    } catch (err) {
      medStatus.textContent = "Error saving medicine.";
      medStatus.classList.add("error");
      console.error(err);
    }
  });

  const orderForm = document.getElementById("order-form");
  const orderStatus = document.getElementById("order-form-status");

  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    orderStatus.textContent = "";
    orderStatus.className = "form-status";

    const payload = {
      hospital: document.getElementById("order-hospital").value.trim(),
      medicineName: document.getElementById("order-med-name").value.trim(),
      quantity: document.getElementById("order-qty").value
    };

    try {
      await fetchJSON(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      orderStatus.textContent = "Order created.";
      orderStatus.classList.add("success");
      orderForm.reset();
      loadDashboard();
    } catch (err) {
      orderStatus.textContent = "Error creating order.";
      orderStatus.classList.add("error");
      console.error(err);
    }
  });

  const aiBtn = document.getElementById("ai-check-btn");
  const aiInput = document.getElementById("ai-expiry-date");
  const aiResult = document.getElementById("ai-result");

  aiBtn.addEventListener("click", async () => {
    const expiryDate = aiInput.value;
    if (!expiryDate) {
      aiResult.textContent = "Please select an expiry date.";
      return;
    }

    try {
      const data = await fetchJSON(`${API_BASE}/api/ai/expiry-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiryDate })
      });

      aiResult.innerHTML = `
        <strong>Risk Level:</strong> ${data.riskLevel}<br/>
        <strong>Days to Expiry:</strong> ${data.daysToExpiry}<br/>
        <strong>Comment:</strong> ${data.comment}
      `;
    } catch (err) {
      aiResult.textContent = "Failed to calculate risk.";
      console.error(err);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  initForms();
});
