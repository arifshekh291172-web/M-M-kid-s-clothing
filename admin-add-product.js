async function addProduct() {
  const token = localStorage.getItem("adminToken");
  if (!token) return alert("Admin login required");

  const data = {
    name: name.value,
    brand: brand.value,
    category: category.value,
    description: description.value,
    price: Number(price.value),
    originalPrice: Number(originalPrice.value),
    stock: Number(stock.value),
    image: image.value,
    images: images.value ? images.value.split(",") : [],
    badge: badge.value
  };

  const res = await fetch("http://localhost:5000/api/admin/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (result.success) {
    msg.innerText = "✅ Product added successfully";
  } else {
    msg.innerText = result.message || "Failed";
  }
}
