/* ===============================
   ADMIN ADD PRODUCT (FILE UPLOAD)
   REAL VERSION – FormData + Images
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
if (mainImage) {
  mainImage.addEventListener("change", () => {
    preview.innerHTML = "";
    showPreview(mainImage.files);
  });
}

if (extraImages) {
  extraImages.addEventListener("change", () => {
    showPreview(extraImages.files);
  });
}

function showPreview(files) {
  Array.from(files).forEach(file => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.width = "80px";
    img.style.height = "80px";
    img.style.objectFit = "cover";
    img.style.margin = "4px";
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

  // Basic validation
  if (
    !name.value ||
    !brand.value ||
    !category.value ||
    !price.value ||
    !originalPrice.value ||
    !mainImage.files.length
  ) {
    msg.innerText = "❌ Please fill all required fields";
    msg.style.color = "red";
    return;
  }

  try {
    const formData = new FormData();

    // TEXT FIELDS
    formData.append("name", name.value.trim());
    formData.append("brand", brand.value.trim());
    formData.append("category", category.value.trim());
    formData.append("description", description.value.trim());
    formData.append("price", price.value);
    formData.append("originalPrice", originalPrice.value);
    formData.append("stock", stock.value || 0);
    formData.append("badge", badge.value || "");

    // MAIN IMAGE (REQUIRED)
    formData.append("image", mainImage.files[0]);

    // EXTRA IMAGES (OPTIONAL)
    Array.from(extraImages.files).forEach(file => {
      formData.append("images", file);
    });

    const res = await fetch(
      "https://m-m-kid-s-clothing.onrender.com/api/admin/products",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}` // ✅ VERY IMPORTANT
          // ❌ Content-Type mat do (browser khud set karega)
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
    console.error("ADD PRODUCT ERROR:", err);
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

  if (mainImage) mainImage.value = "";
  if (extraImages) extraImages.value = "";
  if (preview) preview.innerHTML = "";
}
