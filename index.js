// // ❌ YAHAN API DECLARE MAT KARO
// // API should come from config.js

// const IMAGE_BASE = API; // backend base url
// let allProducts = [];

// /* ======================================================
//    LOAD PRODUCTS
// ====================================================== */
// fetch(API + "/api/products")
//   .then(res => res.json())
//   .then(data => {
//     // backend-safe (array OR {products})
//     allProducts = Array.isArray(data) ? data : (data.products || []);
//     renderProducts(allProducts);
//   })
//   .catch(err => {
//     console.error("PRODUCT LOAD ERROR:", err);
//   });

// /* ======================================================
//    RENDER PRODUCTS
// ====================================================== */
// function renderProducts(products) {
//   const grid = document.getElementById("productsGrid");
//   if (!grid) return;

//   grid.innerHTML = "";

//   if (!products.length) {
//     grid.innerHTML = "<p>No products found</p>";
//     return;
//   }

//   products.forEach(p => {
//     const imgUrl = p.image.startsWith("http")
//       ? p.image
//       : IMAGE_BASE + "/" + p.image; // 🔥 FIXED

//     const card = document.createElement("div");
//     card.className = "product-card";

//     card.innerHTML = `
//       <div class="product-img">
//         <img 
//           src="${imgUrl}" 
//           alt="${p.name}"
//           onerror="this.src='https://via.placeholder.com/300'"
//         >
//       </div>

//       <div class="product-info">
//         <h3>${p.name}</h3>
//         <p class="price">₹${p.price}</p>

//         <p class="stock ${p.stock > 0 ? 'in' : 'out'}">
//           ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}
//         </p>
//       </div>
//     `;

//     // 👉 Product detail page
//     card.onclick = () => {
//       window.location.href = `products.html?id=${p._id}`;
//     };

//     grid.appendChild(card);
//   });
// }

// /* ======================================================
//    CATEGORY FILTER
// ====================================================== */
// function filterByCategory(category, btn) {
//   document.querySelectorAll(".category-btn").forEach(b =>
//     b.classList.remove("active")
//   );
//   btn.classList.add("active");

//   if (category === "all") {
//     renderProducts(allProducts);
//   } else {
//     renderProducts(
//       allProducts.filter(p => p.category === category)
//     );
//   }
// }

// /* ======================================================
//    SEARCH PRODUCTS
// ====================================================== */
// function searchProducts() {
//   const input = document.getElementById("searchInput");
//   if (!input) return;

//   const keyword = input.value.toLowerCase().trim();

//   if (!keyword) {
//     renderProducts(allProducts);
//     return;
//   }

//   renderProducts(
//     allProducts.filter(p =>
//       p.name.toLowerCase().includes(keyword)
//     )
//   );
// }
