/* ======================================================
   CONFIG
====================================================== */
// const API = "https://m-m-kid-s-clothing.onrender.com";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

let product = null;
let selectedSize = null;

/* ======================================================
   LOAD PRODUCT
====================================================== */
async function loadProduct() {
  try {
    if (!productId) {
      document.getElementById("productContainer").innerHTML =
        "<p>❌ Product ID missing</p>";
      return;
    }

    const res = await fetch(`${API}/api/products/${productId}`);
    const data = await res.json();

    // 🔥 backend safe (handles {product} OR direct object)
    product = data.product || data;

    if (!product || !product._id) {
      document.getElementById("productContainer").innerHTML =
        "<p>❌ Product not found</p>";
      return;
    }

    renderProduct(product);

  } catch (err) {
    console.error("PRODUCT LOAD ERROR:", err);
    document.getElementById("productContainer").innerHTML =
      "<p>❌ Failed to load product</p>";
  }
}

/* ======================================================
   RENDER PRODUCT + SIZE CHART
====================================================== */
function renderProduct(p) {

  const sizeButtons = p.sizes && p.sizes.length
    ? p.sizes.map(s => `
        <button
          class="size-btn ${s.stock === 0 ? "disabled" : ""}"
          ${s.stock === 0 ? "disabled" : ""}
          onclick="selectSize('${s.label}', ${s.stock})">
          ${s.label}
        </button>
      `).join("")
    : "<p>No sizes available</p>";

  const sizeChart = p.sizes && p.sizes.length
    ? p.sizes.map(s => `
        <tr>
          <td>${s.label}</td>
          <td>${s.stock > 0 ? s.stock : "Out of stock"}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="2">No size data</td></tr>`;

  document.getElementById("productContainer").innerHTML = `
    <div class="product-wrapper">

      <div class="product-image">
        <img src="${p.image}" alt="${p.name}">
      </div>

      <div class="product-details">
        <h1 id="productName">${p.name}</h1>
        <p id="productBrand">Brand: ${p.brand}</p>

        <div class="price-box">
          <span id="productPrice">₹${p.price}</span>
          <span id="productOriginal">₹${p.originalPrice}</span>
          <span class="discount">${p.discount}% OFF</span>
        </div>

        <p id="productDesc">${p.description || ""}</p>

        <!-- SIZE BUTTONS -->
        <div class="sizes">
          <h4>Select Size</h4>
          <div id="sizeContainer">
            ${sizeButtons}
          </div>
        </div>

        <p id="stockMsg"></p>

        <!-- SIZE CHART -->
        <h4>Size Chart</h4>
        <table class="size-chart">
          <thead>
            <tr>
              <th>Age Group</th>
              <th>Available Stock</th>
            </tr>
          </thead>
          <tbody>
            ${sizeChart}
          </tbody>
        </table>

        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <button onclick="addToCart()">ADD TO CART</button>
          <button onclick="buyNow()">BUY NOW</button>
        </div>
      </div>

    </div>
  `;
}

/* ======================================================
   SIZE SELECT
====================================================== */
function selectSize(size, stock) {
  selectedSize = size;

  document.querySelectorAll(".size-btn")
    .forEach(btn => btn.classList.remove("active"));

  event.target.classList.add("active");

  document.getElementById("stockMsg").innerText =
    `Selected size: ${size} | Stock: ${stock}`;
}

/* ======================================================
   ADD TO CART (LOCAL STORAGE)
====================================================== */
function addToCart() {
  if (!selectedSize) {
    alert("Please select a size");
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const existing = cart.find(
    item => item._id === product._id && item.size === selectedSize
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart");
}

/* ======================================================
   BUY NOW
====================================================== */
function buyNow() {
  addToCart();
  window.location.href = "cart.html";
}

/* ======================================================
   INIT
====================================================== */
loadProduct();
