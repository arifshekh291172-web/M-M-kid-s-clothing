// public/js/api.js
const BACKEND = "https://m-m-kid-s-clothing.onrender.com";

function API(path, options = {}) {
  return fetch(`${BACKEND}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || ""
    },
    ...options
  });
}
