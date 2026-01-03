/* ===============================
   CONFIG
================================ */
const API = "https://m-m-kid-s-clothing.onrender.com";
const productId = new URLSearchParams(location.search).get("id");

let currentProduct = null;
let selectedSize = null;

/* ===============================
   LOAD PRODUCT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  if (!productId) {
    document.getElementById("productContainer").innerHTML =
      "<p>❌ Product ID missing</p>";
    return;
  }

  fetch(`${API}/api/products/${productId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success || !data.product) {
        document.getElementById("productContainer").innerHTML =
          "<p>❌ Product not found</p>";
        return;
      }

      currentProduct = data.product;
      renderProduct(currentProduct);
      loadSuggested(currentProduct.category, currentProduct._id);
    })
    .catch(err => {
      console.error("PRODUCT LOAD ERROR:", err);
      document.getElementById("productContainer").innerHTML =
        "<p>❌ Error loading product</p>";
    });
});

/* ===============================
   RENDER PRODUCT
================================ */
function renderProduct(p) {
  const imageSrc =
    p.image && p.image.startsWith("data:image")
      ? p.image
      : "https://dummyimage.com/400x500/eee/000&text=No+Image";

  const sizeButtons = p.sizes && p.sizes.length
    ? p.sizes.map(s => `
        <button
          class="size-btn ${s.stock === 0 ? "disabled" : ""}"
          ${s.stock === 0 ? "disabled" : ""}
          onclick="selectSize('${s.label}', ${s.stock}, this)">
          ${s.label}
        </button>
      `).join("")
    : "<p>Size not available</p>";

  const sizeChartRows = p.sizes && p.sizes.length
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
        <img src="${imageSrc}" alt="${p.name}">
      </div>

      <div class="product-details">
        <h1>${p.name}</h1>
        <p class="brand">Brand: ${p.brand}</p>

        <div class="price-box">
          <span class="price">₹${p.price}</span>
          <span class="original">₹${p.originalPrice}</span>
          <span class="discount">${p.discount || 0}% OFF</span>
        </div>

        <p class="desc">${p.description || ""}</p>

        <div class="sizes">
          <h4>Select Size</h4>
          <div class="size-options">
            ${sizeButtons}
          </div>
        </div>

        <p id="stockInfo"></p>

        <h4>Size Chart</h4>
        <table class="size-chart">
          <thead>
            <tr>
              <th>Age Group</th>
              <th>Available Stock</th>
            </tr>
          </thead>
          <tbody>
            ${sizeChartRows}
          </tbody>
        </table>

        <div class="action-buttons">
          <button class="add-cart" onclick="addToCart()">ADD TO CART</button>
          <button class="buy-now" onclick="buyNow()">BUY NOW</button>
        </div>

      </div>
    </div>
  `;
}

/* ===============================
   SIZE SELECT
================================ */
function selectSize(label, stock, btn) {
  selectedSize = label;

  document.getElementById("stockInfo").innerText =
    stock > 5
      ? `Selected size: ${label} | In Stock`
      : `Selected size: ${label} | Only ${stock} left`;

  document.querySelectorAll(".size-btn")
    .forEach(b => b.classList.remove("active"));

  btn.classList.add("active");
}

/* ===============================
   CART (LOCAL STORAGE)
================================ */
function addToCart() {
  if (!selectedSize) {
    alert("Please select a size");
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(
    i => i._id === currentProduct._id && i.size === selectedSize
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      _id: currentProduct._id,
      name: currentProduct.name,
      price: currentProduct.price,
      image: currentProduct.image,
      size: selectedSize,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("🛒 Added to cart");
}

function buyNow() {
  addToCart();
  window.location.href = "cart.html";
}

/* ===============================
   SUGGESTED PRODUCTS
================================ */
function loadSuggested(category, currentId) {
  fetch(`${API}/api/products`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;

      const items = data.products
        .filter(p => p.category === category && p._id !== currentId)
        .slice(0, 4);

      document.getElementById("suggestedProducts").innerHTML =
        items.map(p => `
          <div class="suggest-card"
            onclick="location.href='products.html?id=${p._id}'">
            <img src="${p.image}">
            <h4>${p.name}</h4>
            <p>₹${p.price}</p>
          </div>
        `).join("");
    })
    .catch(err => console.error("SUGGESTED ERROR:", err));
}
