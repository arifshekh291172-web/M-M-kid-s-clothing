/* ===============================
   ADMIN ADD PRODUCT (BASE64)
================================ */

/* ===== SHORTCUT ===== */
const el = id => document.getElementById(id);

/* ===== FORM ELEMENTS ===== */
const nameEl = el("name");
const brandEl = el("brand");
const categoryEl = el("category");
const descriptionEl = el("description");
const priceEl = el("price");
const originalPriceEl = el("originalPrice");
const badgeEl = el("badge");

const mainImageEl = el("mainImage");
const extraImagesEl = el("extraImages");

const msgEl = el("msg");
const previewEl = el("preview");

/* ===== SIZE INPUTS ===== */
const sizeInputs = [
  { label: "1Y-2Y", el: el("size-1") },
  { label: "2Y-3Y", el: el("size-2") },
  { label: "3Y-4Y", el: el("size-3") },
  { label: "4Y-5Y", el: el("size-4") },
  { label: "5Y-6Y", el: el("size-5") }
];

/* ===============================
   IMAGE PREVIEW
================================ */
mainImageEl?.addEventListener("change", () => {
  previewEl.innerHTML = "";
  showPreview(mainImageEl.files);
});

extraImagesEl?.addEventListener("change", () => {
  showPreview(extraImagesEl.files);
});

function showPreview(files) {
  if (!files) return;
  Array.from(files).forEach(file => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.cssText =
      "width:90px;height:90px;object-fit:cover;border-radius:8px;margin-right:6px;";
    previewEl.appendChild(img);
  });
}

/* ===============================
   BASE64 CONVERTER
================================ */
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ===============================
   ADD PRODUCT
================================ */
let submitting = false;

async function addProduct() {
  if (submitting) return;
  msgEl.innerText = "";

  /* ===== ADMIN TOKEN ===== */
  const token = localStorage.getItem("adminToken");
  if (!token) {
    alert("❌ Admin login required");
    location.href = "admin-login.html";
    return;
  }

  /* ===== BASIC VALIDATION ===== */
  if (
    !nameEl.value ||
    !brandEl.value ||
    !categoryEl.value ||
    !priceEl.value ||
    !originalPriceEl.value
  ) {
    showError("Please fill all required fields");
    return;
  }

  if (!mainImageEl?.files?.length) {
    showError("Please select a main image");
    return;
  }

  /* ===== SIZE STOCK ===== */
  const sizes = sizeInputs
    .map(s => ({
      label: s.label,
      stock: Number(s.el?.value || 0)
    }))
    .filter(s => s.stock > 0);

  if (!sizes.length) {
    showError("Enter stock for at least one size");
    return;
  }

  submitting = true;

  try {
    /* ===== MAIN IMAGE BASE64 ===== */
    const mainBase64 = await toBase64(mainImageEl.files[0]);

    if (!mainBase64.startsWith("data:image")) {
      showError("Invalid image format");
      submitting = false;
      return;
    }

    // 🔒 Size safety (~5–6MB)
    if (mainBase64.length > 7_000_000) {
      showError("Main image too large. Use smaller image.");
      submitting = false;
      return;
    }

    /* ===== EXTRA IMAGES ===== */
    const extraBase64 = [];
    if (extraImagesEl?.files?.length) {
      for (const file of extraImagesEl.files) {
        const b64 = await toBase64(file);
        if (b64.startsWith("data:image")) {
          extraBase64.push(b64);
        }
      }
    }

    /* ===== REQUEST BODY ===== */
    const body = {
      name: nameEl.value.trim(),
      brand: brandEl.value.trim(),
      category: categoryEl.value.trim(),
      description: descriptionEl.value.trim(),
      price: Number(priceEl.value),
      originalPrice: Number(originalPriceEl.value),
      badge: badgeEl.value || "",
      sizes,
      image: mainBase64,
      images: extraBase64
    };

    console.log("ADD PRODUCT BODY:", {
      ...body,
      image: body.image.substring(0, 40) + "..."
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
      showSuccess("Product added successfully 🎉");
      clearForm();
    } else {
      showError(result.message || "Failed to add product");
      console.error("SERVER RESPONSE:", result);
    }

  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    showError("Server error");
  } finally {
    submitting = false;
  }
}

/* ===============================
   UI HELPERS
================================ */
function showError(text) {
  msgEl.innerText = "❌ " + text;
  msgEl.style.color = "red";
}

function showSuccess(text) {
  msgEl.innerText = "✅ " + text;
  msgEl.style.color = "green";
}

/* ===============================
   CLEAR FORM
================================ */
function clearForm() {
  nameEl.value = "";
  brandEl.value = "";
  categoryEl.value = "";
  descriptionEl.value = "";
  priceEl.value = "";
  originalPriceEl.value = "";
  badgeEl.value = "";

  sizeInputs.forEach(s => s.el && (s.el.value = ""));
  mainImageEl.value = "";
  extraImagesEl.value = "";
  previewEl.innerHTML = "";
}
