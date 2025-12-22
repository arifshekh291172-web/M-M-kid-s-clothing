// public/js/api.js
const BACKEND = "http://localhost:5000";

function API(path, options = {}) {
  return fetch(`${BACKEND}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || ""
    },
    ...options
  });
}
