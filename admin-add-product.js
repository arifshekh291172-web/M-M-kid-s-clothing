/* ===============================
   ADMIN ADD PRODUCT (FILE UPLOAD)
================================ */

/* ===== GET ELEMENTS ===== */
const name = document.getElementById("name");
const brand = document.getElementById("brand");
const category = document.getElementById("category");
const description = document.getElementById("description");
const price = document.getElementById("price");
const originalPrice = document.getElementById("originalPrice");
const stock = document.getElementById("stock");

const mainImage = document.getElementById("mainImage");
const extraImages = document.getElementById("extraImages");

const badge = document.getElementById("badge");
const msg = document.getElementById("msg");
const preview = document.getElementById("preview");

/* ===== IMAGE PREVIEW ===== */
mainImage.addEventListener("change", () => {
  preview.innerHTML = "";
  showPreview(mainImage.files);
});

extraImages.addEventListener("change", () => {
  showPreview(extraImages.files);
});

function showPreview(files) {
  Array.from(files).forEach(file => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  });
}

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
    !originalPrice.value ||
    mainImage.files.length === 0
  ) {
    msg.innerText = "❌ Please fill all required fields";
    msg.style.color = "red";
    return;
  }

  try {
    const formData = new FormData();

    formData.append("name", name.value.trim());
    formData.append("brand", brand.value.trim());
    formData.append("category", category.value.trim());
    formData.append("description", description.value.trim());
    formData.append("price", price.value);
    formData.append("originalPrice", originalPrice.value);
    formData.append("stock", stock.value || 0);
    formData.append("badge", badge.value || "");

    // Main image (required)
    formData.append("image", mainImage.files[0]);

    // Extra images (optional)
    Array.from(extraImages.files).forEach(file => {
      formData.append("images", file);
    });

    const res = await fetch(
      "https://m-m-kid-s-clothing.onrender.com/api/admin/products",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}` // ✅ YAHI ERROR THA
        },
        body: formData
      }
    );

    const result = await res.json();

    if (res.ok) {
      msg.innerText = "✅ Product added successfully";
      msg.style.color = "green";
      clearForm();
    } else {
      msg.innerText = result.message || "❌ Failed to add product";
      msg.style.color = "red";
    }

  } catch (err) {
    console.error(err);
    msg.innerText = "❌ Server error";
    msg.style.color = "red";
  }
}

/* ===== CLEAR FORM ===== */
function clearForm() {
  name.value = "";
  brand.value = "";
  category.value = "";
  description.value = "";
  price.value = "";
  originalPrice.value = "";
  stock.value = "";
  badge.value = "";
  mainImage.value = "";
  extraImages.value = "";
  preview.innerHTML = "";
}
