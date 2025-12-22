/* ======================================================
   ACCOUNT DROPDOWN
====================================================== */
function toggleAccount() {
  const dropdown = document.getElementById("accountDropdown");
  if (!dropdown) return;
  dropdown.classList.toggle("show");
}

// Close dropdown on outside click
document.addEventListener("click", (e) => {
  const wrapper = document.getElementById("accountWrapper");
  const dropdown = document.getElementById("accountDropdown");

  if (!wrapper || !dropdown) return;

  if (!wrapper.contains(e.target)) {
    dropdown.classList.remove("show");
  }
});

/* ======================================================
   LOGIN STATE (BACKEND CONNECTED)
====================================================== */
(function initAuthUI() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const accountName = document.getElementById("accountName");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const dropdown = document.getElementById("accountDropdown");

  // Safety checks
  if (!accountName || !loginBtn || !logoutBtn) return;

  if (user && token) {
    // Display name priority: name → username → email
    accountName.innerText =
      user.name || user.username || user.email || "Account";

    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";

    // Optional: Admin link auto-show
    if (user.role === "admin" || user.role === "superadmin") {
      if (!document.getElementById("adminLink")) {
        const adminLink = document.createElement("a");
        adminLink.id = "adminLink";
        adminLink.href = "admin-dashboard.html";
        adminLink.innerText = "Admin Dashboard";
        dropdown.insertBefore(adminLink, dropdown.firstChild);
      }
    }
  } else {
    // Not logged in
    accountName.innerText = "Account";
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
  }
})();

/* ======================================================
   LOGOUT
====================================================== */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Close dropdown if open
  const dropdown = document.getElementById("accountDropdown");
  if (dropdown) dropdown.classList.remove("show");

  // Redirect to login
  window.location.href = "login.html";
}
