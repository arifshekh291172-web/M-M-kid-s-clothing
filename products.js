const API = "https://m-m-kid-s-clothing.onrender.com";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
  document.body.innerHTML = "<h2>Product not found</h2>";
}

/* LOAD PRODUCT */
async function loadProduct() {
  const res = await fetch(`${API}/api/products/${productId}`);
  const data = await res.json();

  if (!data.success) {
    document.body.innerHTML = "<h2>Product not found</h2>";
    return;
  }

  renderProduct(data.product);
}

function renderProduct(p) {
  document.getElementById("productDetail").innerHTML = `
    <div class="product-detail-wrapper">

      <div class="product-images">
        <img src="${p.image}" class="main-image">
      </div>

      <div class="product-info">
        <h1>${p.name}</h1>
        <p class="brand">${p.brand}</p>

        <div class="rating">
          ★ ${p.rating} (${p.reviews} reviews)
        </div>

        <div class="price">
          <span class="current">₹${p.price}</span>
          <span class="original">₹${p.originalPrice}</span>
          <span class="discount">${p.discount}% off</span>
        </div>

        <p class="description">${p.description || "No description available"}</p>

        <p class="stock">
          ${p.stock > 0 ? "In Stock" : "Out of Stock"}
        </p>

        <div class="actions">
          <button onclick="addToCart('${p._id}')">Add to Cart</button>
          <button onclick="buyNow('${p._id}')">Buy Now</button>
        </div>

      </div>
    </div>
  `;
}

loadProduct();

/* CART (SIMPLE) */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(id) {
  const existing = cart.find(i => i._id === id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ _id: id, quantity: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart");
}

function buyNow(id) {
  addToCart(id);
  window.location.href = "checkout.html";
}
