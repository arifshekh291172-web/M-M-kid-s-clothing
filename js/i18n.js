const translations = {
  en: {
    footer_about: "Premium kids clothing with comfort and style."
  },
  hi: {
    footer_about: "बच्चों के लिए आरामदायक और स्टाइलिश कपड़े।"
  },
  mr: {
    footer_about: "मुलांसाठी आरामदायक आणि स्टायलिश कपडे."
  }
};

function setLang(lang) {
  localStorage.setItem("lang", lang);
  applyLang();
  toggleLangMenu();
}

function applyLang() {
  const lang = localStorage.getItem("lang") || "en";
  const label = document.getElementById("currentLang");
  if (label) label.innerText = lang.toUpperCase();

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (translations[lang][key]) {
      el.innerText = translations[lang][key];
    }
  });
}

function toggleLangMenu() {
  document.getElementById("langMenu").classList.toggle("hidden");
}

document.addEventListener("DOMContentLoaded", applyLang);
