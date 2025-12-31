/* ===============================
   ADMIN ADD PRODUCT (BASE64)
================================ */

/* ===== GET ELEMENTS ===== */
const name = document.getElementById("name");
const brand = document.getElementById("brand");
const category = document.getElementById("category");
const description = document.getElementById("description");
const price = document.getElementById("price");
const originalPrice = document.getElementById("originalPrice");
const badge = document.getElementById("badge");

const mainImage = document.getElementById("mainImage");
const extraImages = document.getElementById("extraImages");

const msg = document.getElementById("msg");
const preview = document.getElementById("preview");

/* ===== SIZE INPUTS ===== */
const sizeInputs = [
  { label: "1Y-2Y", el: document.getElementById("size-1") },
  { label: "2Y-3Y", el: document.getElementById("size-2") },
  { label: "3Y-4Y", el: document.getElementById("size-3") },
  { label: "4Y-5Y", el: document.getElementById("size-4") },
  { label: "5Y-6Y", el: document.getElementById("size-5") }
];

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
    img.style.width = "90px";
    img.style.height = "90px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "8px";
    preview.appendChild(img);
  });
}

/* ===== BASE64 CONVERTER ===== */
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

/* ===== ADD PRODUCT ===== */
async function addProduct() {
  msg.innerText = "";

  const token = localStorage.getItem("adminToken");
  if (!token) {
    alert("Admin login required");
    return;
  }

  /* ===== BASIC VALIDATION ===== */
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

  /* ===== IMAGE VALIDATION ===== */
  if (!mainImage || !mainImage.files || mainImage.files.length === 0) {
    msg.innerText = "❌ Please select main image";
    msg.style.color = "red";
    console.error("MAIN IMAGE FILE:", mainImage?.files?.[0]);
    return;
  }

  const mainFile = mainImage.files[0];
  console.log("MAIN IMAGE FILE:", mainFile);

  /* ===== SIZE-WISE STOCK ===== */
  const sizes = sizeInputs
    .map(s => ({
      label: s.label,
      stock: Number(s.el?.value || 0)
    }))
    .filter(s => s.stock > 0);

  if (!sizes.length) {
    msg.innerText = "❌ Please enter stock for at least one size";
    msg.style.color = "red";
    return;
  }

  try {
    /* ===== CONVERT IMAGES TO BASE64 ===== */
    const mainBase64 = await toBase64(mainFile);
    console.log("MAIN IMAGE BASE64:", mainBase64.substring(0, 40));

    const extraBase64 = [];
    if (extraImages && extraImages.files.length > 0) {
      for (const file of extraImages.files) {
        extraBase64.push(await toBase64(file));
      }
    }

    /* ===== BUILD BODY ===== */
    const body = {
      name: name.value.trim(),
      brand: brand.value.trim(),
      category: category.value.trim(),
      description: description.value.trim(),
      price: Number(price.value),
      originalPrice: Number(originalPrice.value),
      badge: badge.value || "",
      sizes,
      image: mainBase64,     // 🔥 REQUIRED
      images: extraBase64
    };

    console.log("FINAL BODY SENT:", {
      ...body,
      image: body.image.substring(0, 30)
    });

    /* ===== API CALL ===== */
    const res = await fetch(
      "https://m-m-kid-s-clothing.onrender.com/api/admin/products",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      }
    );

    const result = await res.json();

    if (res.ok && result.success) {
      msg.innerText = "✅ Product added successfully";
      msg.style.color = "green";
      clearForm();
    } else {
      msg.innerText = result.message || "❌ Failed to add product";
      msg.style.color = "red";
      console.error("SERVER RESPONSE:", result);
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
  badge.value = "";

  sizeInputs.forEach(s => {
    if (s.el) s.el.value = "";
  });

  if (mainImage) mainImage.value = "";
  if (extraImages) extraImages.value = "";
  if (preview) preview.innerHTML = "";
}
