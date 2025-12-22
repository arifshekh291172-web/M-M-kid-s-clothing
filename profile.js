/* =========================================
   CONFIG
========================================= */
const API = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

/* =========================================
   SIDEBAR NAVIGATION
========================================= */
function show(sectionId) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.remove("active");
  });
  document.getElementById(sectionId).classList.add("active");

  document.querySelectorAll(".sidebar a").forEach(a => {
    a.classList.remove("active");
  });
  event.target.classList.add("active");
}

/* =========================================
   LOAD PROFILE (USER INFO)
========================================= */
async function loadProfile() {
  try {
    const res = await fetch(API + "/api/auth/me", {
      headers: { Authorization: token }
    });
    const user = await res.json();

    document.getElementById("name").innerText = user.name;
    document.getElementById("email").innerText = user.email;
    document.getElementById("phone").innerText = user.phone || "Not added";

  } catch (err) {
    console.error("PROFILE LOAD ERROR:", err);
  }
}

/* =========================================
   LOAD USER ORDERS
========================================= */
async function loadOrders() {
  try {
    const res = await fetch(API + "/api/orders/my", {
      headers: { Authorization: token }
    });
    const orders = await res.json();

    const table = document.getElementById("ordersTable");

    orders.forEach(o => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${o._id}</td>
        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
        <td>₹${o.totalAmount}</td>
        <td>${o.status}</td>
        <td>
          <button onclick="viewOrder('${o._id}')">View</button>
        </td>
      `;
      table.appendChild(row);
    });

  } catch (err) {
    console.error("ORDERS LOAD ERROR:", err);
  }
}

function viewOrder(orderId) {
  window.location.href = "order-tracking.html?id=" + orderId;
}

/* =========================================
   LOAD ADDRESSES
========================================= */
async function loadAddresses() {
  try {
    const res = await fetch(API + "/api/checkout/address", {
      headers: { Authorization: token }
    });
    const addresses = await res.json();

    const list = document.getElementById("addressList");
    list.innerHTML = "";

    addresses.forEach(a => {
      const div = document.createElement("div");
      div.className = "address";
      div.innerHTML = `
        <strong>${a.name}</strong> (${a.phone})<br>
        ${a.addressLine1}, ${a.city} - ${a.pincode}
        <div class="address-actions">
          <button onclick="editAddress('${a._id}')">Edit</button>
          <button class="danger" onclick="deleteAddress('${a._id}')">Delete</button>
        </div>
      `;
      list.appendChild(div);
    });

  } catch (err) {
    console.error("ADDRESS LOAD ERROR:", err);
  }
}

function addAddress() {
  alert("Address modal open karo (next step)");
}

function editAddress(id) {
  alert("Edit address: " + id);
}

async function deleteAddress(id) {
  if (!confirm("Delete this address?")) return;

  await fetch(API + "/api/checkout/address/" + id, {
    method: "DELETE",
    headers: { Authorization: token }
  });

  loadAddresses();
}

/* =========================================
   WALLET
========================================= */
async function loadWallet() {
  try {
    const res = await fetch(API + "/api/wallet", {
      headers: { Authorization: token }
    });
    const wallet = await res.json();

    document.getElementById("walletBalance").innerText = wallet.balance;

    const table = document.getElementById("walletTable");

    wallet.transactions.forEach(t => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(t.date).toLocaleDateString()}</td>
        <td>${t.type}</td>
        <td>₹${t.amount}</td>
        <td>${t.reason}</td>
      `;
      table.appendChild(row);
    });

  } catch (err) {
    console.error("WALLET LOAD ERROR:", err);
  }
}

/* =========================================
   CHANGE PASSWORD
========================================= */
async function changePassword() {
  const oldPass = document.getElementById("oldPass").value;
  const newPass = document.getElementById("newPass").value;

  if (!oldPass || !newPass) {
    alert("Fill all fields");
    return;
  }

  const res = await fetch(API + "/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ oldPass, newPass })
  });

  const data = await res.json();
  alert(data.message || "Password updated");
}

/* =========================================
   LOGOUT
========================================= */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/* =========================================
   INIT
========================================= */
loadProfile();
loadOrders();
loadAddresses();
loadWallet();
