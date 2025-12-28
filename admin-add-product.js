/* ===============================
   ADMIN ADD PRODUCTS (JSON VERSION)
   ❌ FormData upload abhi nahi
   ✅ Backend compatible
================================ */

/* ===== GET ELEMENTS ===== */
const name = document.getElementById("name");
const brand = document.getElementById("brand");
const category = document.getElementById("category");
const description = document.getElementById("description");
const price = document.getElementById("price");
const originalPrice = document.getElementById("originalPrice");
const stock = document.getElementById("stock");
const badge = document.getElementById("badge");

const mainImage = document.getElementById("mainImage");       // optional
const extraImages = document.getElementById("extraImages");   // optional
const preview = document.getElementById("preview");           // optional

const msg = document.getElementById("msg");

/* ===== ADD PRODUCT ===== */
async function addProduct() {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    alert("❌ Admin login required");
    return;
  }

  if (
    !name.value ||
    !brand.value ||
    !category.value ||
    !price.value ||
    !originalPrice.value
  ) {
    msg.innerText = "❌ Please fill all required fields";
    msg.style.color = "red";
    return;
  }

  try {
    const res = await fetch(
      "https://m-m-kid-s-clothing.onrender.com/api/admin/products",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.value.trim(),
          brand: brand.value.trim(),
          category: category.value.trim(),
          description: description.value.trim(),
          price: Number(price.value),
          originalPrice: Number(originalPrice.value),
          stock: Number(stock.value || 0),
          badge: badge.value || "",

          // REQUIRED by Product schema
          image: "https://dummyimage.com/300x300",
          images: []
        })
      }
    );

    const data = await res.json();

    if (res.ok) {
      msg.innerText = "✅ Product added successfully";
      msg.style.color = "green";
      clearForm();
    } else {
      msg.innerText = data.message || "❌ Failed to add product";
      msg.style.color = "red";
    }

  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    msg.innerText = "❌ Server error";
    msg.style.color = "red";
  }
}

/* ===== CLEAR FORM (WITH IMAGE RESET) ===== */
function clearForm() {
  name.value = "";
  brand.value = "";
  category.value = "";
  description.value = "";
  price.value = "";
  originalPrice.value = "";
  stock.value = "";
  badge.value = "";

  if (mainImage) mainImage.value = "";
  if (extraImages) extraImages.value = "";
  if (preview) preview.innerHTML = "";
}
