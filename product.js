const API = "http://localhost:5000";
const token = localStorage.getItem("adminToken");

if (!token) {
  location.href = "admin-login.html";
}

const preview = document.getElementById("preview");
const mainImageInp = document.getElementById("mainImage");
const extraImagesInp = document.getElementById("extraImages");

/* IMAGE PREVIEW */
function showPreview(files) {
  [...files].forEach(file => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  });
}

mainImageInp.onchange = () => {
  preview.innerHTML = "";
  showPreview(mainImageInp.files);
};

extraImagesInp.onchange = () => {
  showPreview(extraImagesInp.files);
};

/* ADD PRODUCT */
async function addProduct() {
  const fd = new FormData();

  fd.append("name", name.value);
  fd.append("brand", brand.value);
  fd.append("category", category.value);
  fd.append("description", description.value);
  fd.append("price", price.value);
  fd.append("originalPrice", originalPrice.value);
  fd.append("stock", stock.value);
  fd.append("badge", badge.value);

  if (mainImageInp.files[0]) {
    fd.append("mainImage", mainImageInp.files[0]);
  }

  [...extraImagesInp.files].forEach(img => {
    fd.append("images", img);
  });

  if (!name.value || !price.value) {
    msg.innerText = "Name & Price required";
    return;
  }

  msg.innerText = "Uploading...";

  const res = await fetch(API + "/api/admin/products", {
    method: "POST",
    headers: {
      Authorization: token
    },
    body: fd
  });

  const data = await res.json();

  if (data.success === false) {
    msg.innerText = data.message || "Failed";
  } else {
    msg.innerText = "Product added successfully";
    setTimeout(() => {
      location.href = "admin-dashboard.html";
    }, 1000);
  }
}
