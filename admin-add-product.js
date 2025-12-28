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

  if (!name.value || !price.value || !stock.value || mainImage.files.length === 0) {
    msg.innerText = "❌ Please fill required fields";
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
    formData.append("originalPrice", originalPrice.value || 0);
    formData.append("stock", stock.value);
    formData.append("badge", badge.value);

    // Main image
    formData.append("image", mainImage.files[0]);

    // Extra images
    Array.from(extraImages.files).forEach(file => {
      formData.append("images", file);
    });

    const res = await fetch("http://localhost:5000/api/admin/products", {
      method: "POST",
      headers: {
        Authorization: token
        // ❌ Content-Type MAT DO (FormData khud set karta hai)
      },
      body: formData
    });

    const result = await res.json();

    if (result.success) {
      msg.innerText = "✅ Product added successfully";
      msg.style.color = "green";
      clearForm();
    } else {
      msg.innerText = result.message || "❌ Failed";
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
  mainImage.value = "";
  extraImages.value = "";
  badge.value = "";
  preview.innerHTML = "";
}
