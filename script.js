const SITE_CONFIG = {
  // Reemplaza este numero por tu WhatsApp real con codigo de pais, sin + ni espacios.
  whatsappNumber: "56942544093",
  whatsappText: "Hola, quiero cotizar o mejorar mi plan de salud",
};

const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const whatsappLinks = document.querySelectorAll("[data-whatsapp-link]");
const leadForm = document.querySelector("#leadForm");
const formStatus = document.querySelector("#formStatus");

function whatsappUrl(message = SITE_CONFIG.whatsappText) {
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function syncWhatsappLinks() {
  whatsappLinks.forEach((link) => {
    link.href = whatsappUrl(link.textContent.includes("Corporate") ? "Hola, quiero consultar por plan Corporate" : undefined);
    link.target = "_blank";
    link.rel = "noopener";
  });
}

function closeMobileNav() {
  document.body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
}

function setError(fieldName, message) {
  const field = document.querySelector(`#${fieldName}`);
  const error = document.querySelector(`[data-error-for="${fieldName}"]`);

  if (!field || !error) return;

  const wrapper = field.parentElement?.parentElement?.classList.contains("two")
    ? field.parentElement
    : field.closest(".form-row");

  wrapper?.classList.toggle("is-invalid", Boolean(message));
  error.textContent = message;
}

function clearFormErrors() {
  ["nombre", "telefono", "email", "sistema"].forEach((name) => setError(name, ""));
  formStatus.classList.remove("success", "error");
}

function getValue(formData, key) {
  return String(formData.get(key) || "").trim();
}

function validateForm(formData) {
  let valid = true;
  const email = getValue(formData, "email");

  if (!getValue(formData, "nombre")) {
    setError("nombre", "Ingresa tu nombre completo.");
    valid = false;
  }

  if (!getValue(formData, "telefono")) {
    setError("telefono", "Ingresa tu telefono o WhatsApp.");
    valid = false;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("email", "Ingresa un correo valido.");
    valid = false;
  }

  if (!getValue(formData, "sistema")) {
    setError("sistema", "Selecciona tu sistema actual.");
    valid = false;
  }

  return valid;
}

function buildLeadSummary(formData) {
  const fields = [
    ["Nombre", "nombre"],
    ["Telefono", "telefono"],
    ["Correo", "email"],
    ["Edad", "edad"],
    ["Region", "region"],
    ["Sistema actual", "sistema"],
    ["Isapre actual", "isapreActual"],
    ["Asesoria previsional AFP", "afp"],
    ["Renta aproximada", "renta"],
    ["Cargas", "cargas"],
    ["Comentario", "comentario"],
  ];

  const lines = fields
    .map(([label, key]) => {
      const value = getValue(formData, key);
      return value ? `${label}: ${value}` : "";
    })
    .filter(Boolean);

  return ["Hola, quiero cotizar o mejorar mi plan de salud.", "", ...lines].join("\n");
}

navToggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeMobileNav();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileNav();
});

document.querySelector("[data-faq-list]")?.addEventListener("toggle", (event) => {
  const activeItem = event.target;
  if (!(activeItem instanceof HTMLDetailsElement) || !activeItem.open) return;

  document.querySelectorAll(".faq-item[open]").forEach((item) => {
    if (item !== activeItem) item.removeAttribute("open");
  });
}, true);

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -48px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
    observer.observe(element);
  });
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
}

leadForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  clearFormErrors();

  const formData = new FormData(leadForm);

  if (!validateForm(formData)) {
    formStatus.textContent = "Revisa los campos marcados y vuelve a intentar.";
    formStatus.classList.add("error");
    return;
  }

  // Aqui puedes enviar formData a Formspree, Google Sheets, backend, CRM o email.
  formStatus.textContent = "Gracias. Recibimos tus datos y te contactaremos pronto para revisar tu caso.";
  formStatus.classList.add("success");

  // Deja el mensaje listo por WhatsApp como conversion principal.
  window.open(whatsappUrl(buildLeadSummary(formData)), "_blank", "noopener");
  leadForm.reset();
});

leadForm?.addEventListener("input", () => {
  formStatus.classList.remove("success", "error");
});

syncWhatsappLinks();
