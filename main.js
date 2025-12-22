/* =========================================
   GLOBAL STATE
========================================= */
let products = [];
let displayedProducts = [];
let cart = [];
let currentCategory = "all";

/* =========================================
   INIT
========================================= */
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  startBannerSlider();
});

/* =========================================
   LOAD PRODUCTS (BACKEND)
========================================= */
async function loadProducts() {
  try {
    const res = await fetch("http://localhost:5000/api/products");
    const data = await res.json();

    products = data.products || data;
    displayedProducts = [...products];

    renderProducts();
  } catch (err) {
    console.error("PRODUCT LOAD ERROR:", err);
  }
}

/* =========================================
   RENDER PRODUCTS
========================================= */
function renderProducts() {
  const grid = document.getElementById("productsGrid");

  if (!displayedProducts.length) {
    grid.innerHTML = "<p>No products found</p>";
    return;
  }

  grid.innerHTML = displayedProducts.map(p => `
    <div class="product-card">
      <div class="product-image-wrapper">
        <img src="${p.image}" class="product-image" />
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
        <button class="wishlist-btn" onclick="toggleWishlist('${p._id}')">♡</button>
      </div>

      <div class="product-info">
        <div class="product-brand">${p.brand}</div>
        <h3 class="product-name">${p.name}</h3>

        <div class="product-rating">
          <span class="rating-badge">★ ${p.rating || 0}</span>
          <span class="rating-count">(${p.reviews || 0})</span>
        </div>

        <div class="product-price">
          <span class="current-price">₹${p.price}</span>
          <span class="original-price">₹${p.originalPrice}</span>
          <span class="discount">${p.discount}% off</span>
        </div>

        <div class="product-actions">
          <button class="add-to-cart-btn" onclick="addToCart('${p._id}')">
            Add to Cart
          </button>
          <button class="buy-now-btn" onclick="buyNow('${p._id}')">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

/* =========================================
   CATEGORY FILTER (FIXED ACTIVE)
========================================= */
function filterByCategory(category, btn) {
  currentCategory = category;

  document.querySelectorAll(".category-btn")
    .forEach(b => b.classList.remove("active"));

  btn.classList.add("active");

  displayedProducts =
    category === "all"
      ? [...products]
      : products.filter(p => p.category === category);

  renderProducts();
  scrollToProducts();
}

/* =========================================
   SORT PRODUCTS
========================================= */
function sortProducts() {
  const value = document.getElementById("sortFilter").value;

  switch (value) {
    case "price-low":
      displayedProducts.sort((a, b) => a.price - b.price);
      break;

    case "price-high":
      displayedProducts.sort((a, b) => b.price - a.price);
      break;

    case "rating":
      displayedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;

    case "discount":
      displayedProducts.sort((a, b) => b.discount - a.discount);
      break;

    default:
      displayedProducts =
        currentCategory === "all"
          ? [...products]
          : products.filter(p => p.category === currentCategory);
  }

  renderProducts();
}

/* =========================================
   SEARCH
========================================= */
function searchProducts() {
  const term = document.getElementById("searchInput").value.toLowerCase();

  displayedProducts = products.filter(p =>
    p.name.toLowerCase().includes(term) ||
    p.brand.toLowerCase().includes(term) ||
    p.category.toLowerCase().includes(term)
  );

  renderProducts();
  scrollToProducts();
}

/* =========================================
   CART
========================================= */
function addToCart(productId) {
  const product = products.find(p => p._id === productId);
  if (!product) return;

  const existing = cart.find(i => i._id === productId);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });

  updateCart();
  showToast("Added to cart");
}

function buyNow(productId) {
  addToCart(productId);
  toggleCart();
}

function updateCart() {
  const cartCount = document.getElementById("cartCount");
  const cartItems = document.getElementById("cartItems");
  const cartFooter = document.getElementById("cartFooter");
  const cartTotal = document.getElementById("cartTotal");

  cartCount.innerText = cart.reduce((s, i) => s + i.qty, 0);

  if (!cart.length) {
    cartItems.innerHTML = `<div class="empty-cart">
      <div class="empty-cart-icon">🛒</div>
      <p>Your cart is empty</p>
    </div>`;
    cartFooter.style.display = "none";
    return;
  }

  cartItems.innerHTML = cart.map(i => `
    <div class="cart-item">
      <img src="${i.image}" class="cart-item-image">
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-price">₹${i.price}</div>
        <div class="quantity-controls">
          <button onclick="changeQty('${i._id}', -1)">-</button>
          <span>${i.qty}</span>
          <button onclick="changeQty('${i._id}', 1)">+</button>
        </div>
      </div>
      <button class="remove-item" onclick="removeItem('${i._id}')">×</button>
    </div>
  `).join("");

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  cartTotal.innerText = `₹${total}`;
  cartFooter.style.display = "block";
}

function changeQty(id, delta) {
  const item = cart.find(i => i._id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i._id !== id);
  updateCart();
}

function removeItem(id) {
  cart = cart.filter(i => i._id !== id);
  updateCart();
}

function toggleCart() {
  document.getElementById("cartSidebar").classList.toggle("open");
  document.getElementById("cartOverlay").classList.toggle("active");
}

/* =========================================
   WISHLIST (BACKEND READY)
========================================= */
async function toggleWishlist(productId) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login required");
    return;
  }

  await fetch("http://localhost:5000/api/wishlist/toggle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ productId })
  });

  showToast("Wishlist updated");
}

/* =========================================
   BANNER
========================================= */
let slide = 0;
function startBannerSlider() {
  setInterval(() => {
    slide = (slide + 1) % 3;
    document.getElementById("bannerSlider")
      .style.transform = `translateX(-${slide * 100}%)`;
  }, 5000);
}

/* =========================================
   UTIL
========================================= */
function scrollToProducts() {
  document.getElementById("productsSection")
    .scrollIntoView({ behavior: "smooth" });
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}
