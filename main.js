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
    const res = await fetch(API + "/api/products");
    const data = await res.json();

    products = data.products || [];
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
  if (!grid) return;

  if (!displayedProducts.length) {
    grid.innerHTML = "<p>No products found</p>";
    return;
  }

  grid.innerHTML = displayedProducts.map(p => {

    // ✅ BASE64 IMAGE (DIRECT FROM DB)
    const imageSrc =
      p.image && p.image.startsWith("data:image")
        ? p.image
        : "https://dummyimage.com/300x400/eee/000&text=No+Image";

    return `
      <div class="product-card" onclick="openProduct('${p._id}')">

        <div class="product-image-wrapper">
          <img
            src="${imageSrc}"
            class="product-image"
            alt="${p.name}"
          />

          ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}

          <button class="wishlist-btn"
            onclick="event.stopPropagation(); toggleWishlist('${p._id}')">
            ♡
          </button>
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
            <span class="discount">${p.discount || 0}% off</span>
          </div>

          <div class="product-actions">
            <button class="add-to-cart-btn"
              onclick="event.stopPropagation(); addToCart('${p._id}')">
              Add to Cart
            </button>
            <button class="buy-now-btn"
              onclick="event.stopPropagation(); buyNow('${p._id}')">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/* =========================================
   OPEN PRODUCT DETAIL
========================================= */
function openProduct(id) {
  window.location.href = `products.html?id=${id}`;
}

/* =========================================
   CATEGORY FILTER
========================================= */
function filterByCategory(category, btn) {
  currentCategory = category;

  document.querySelectorAll(".category-btn")
    .forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  displayedProducts =
    category === "all"
      ? [...products]
      : products.filter(p => p.category.toLowerCase() === category);

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
      displayedProducts.sort((a, b) => (b.discount || 0) - (a.discount || 0));
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
  const term = document.getElementById("searchInput").value.toLowerCase().trim();

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
    cartItems.innerHTML = `<p>Your cart is empty</p>`;
    cartFooter.style.display = "none";
    return;
  }

  cartItems.innerHTML = cart.map(i => `
    <div class="cart-item">
      <img src="${i.image}">
      <div>
        <p>${i.name}</p>
        <p>₹${i.price}</p>
      </div>
    </div>
  `).join("");

  cartTotal.innerText = "₹" + cart.reduce((s, i) => s + i.price * i.qty, 0);
  cartFooter.style.display = "block";
}

/* =========================================
   CART TOGGLE
========================================= */
function toggleCart() {
  document.getElementById("cartSidebar").classList.toggle("open");
  document.getElementById("cartOverlay").classList.toggle("active");
}

/* =========================================
   BANNER SLIDER
========================================= */
let slide = 0;
function startBannerSlider() {
  setInterval(() => {
    slide = (slide + 1) % 3;
    document.getElementById("bannerSlider").style.transform =
      `translateX(-${slide * 100}%)`;
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
