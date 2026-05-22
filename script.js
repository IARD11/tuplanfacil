const SITE_CONFIG = {
  whatsappNumber: "56942544093",
  whatsappText: "Hola, quiero cotizar o mejorar mi plan de salud",
  supabaseUrl: "https://krxlcsnvullrubryponq.supabase.co",
  supabaseKey: "sb_publishable_L2lJ4PSyiUZPMEbkrFjOIQ_fJ9y9Wwb",
  submitCooldownMs: 60000,
  testimonialsStorageKey: "tuplanfacil-testimonials",
  maxVisibleTestimonials: 12,
  defaultTestimonials: [
    {
      id: "rescatado-20260522-153648",
      name: "Mary",
      context: "Cliente TuPlanFácil",
      rating: 5,
      comment:
        "La asesoría de Ignacio fue buenísima, aclaró todas las dudas que tenía en todo momento y siempre con muy buena disposición. Full recomendado!",
    },
    {
      id: "rescatado-20260522-153851",
      name: "Felipe C.",
      context: "Planes corporate",
      rating: 5,
      comment:
        "Ignacio me ayudó a tomar la mejor decisión en cuanto a planes corporate, me guio a dejar de perder plata con mi antigua isapre y me ayudó a cambiarme a la isapre con la que mi empresa tiene convenio",
    },
  ],
};

const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const whatsappLinks = document.querySelectorAll("[data-whatsapp-link]");
const leadForm = document.querySelector("#leadForm");
const formStatus = document.querySelector("#formStatus");
const testimonialForm = document.querySelector("#testimonialForm");
const testimonialList = document.querySelector("#testimonialList");
const testimonialStatus = document.querySelector("#testimonialStatus");

let lastSubmitTime = 0;

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, "").replace(/[<>]/g, "");
}

function whatsappUrl(message = SITE_CONFIG.whatsappText) {
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function syncWhatsappLinks() {
  whatsappLinks.forEach((link) => {
    link.href = whatsappUrl(
      link.textContent.includes("Corporate")
        ? "Hola, quiero consultar por plan Corporate"
        : undefined
    );
    link.target = "_blank";
    link.rel = "noopener noreferrer";
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
  return stripHtml(String(formData.get(key) || "").trim());
}

function nullableValue(formData, key) {
  const value = getValue(formData, key);
  return value || null;
}

function parseOptionalInteger(value) {
  const number = Number.parseInt(String(value || "").replace(/\D/g, ""), 10);
  return Number.isFinite(number) ? number : null;
}

function formPayload(formData) {
  const payload = {};
  formData.forEach((value, key) => {
    if (String(key).toLowerCase().includes("website")) return;
    payload[key] = stripHtml(String(value || "")).slice(0, 1000);
  });
  return payload;
}

function validateForm(formData) {
  let valid = true;
  const email = getValue(formData, "email");

  if (!getValue(formData, "nombre")) {
    setError("nombre", "Ingresa tu nombre completo.");
    valid = false;
  }
  if (!getValue(formData, "telefono")) {
    setError("telefono", "Ingresa tu teléfono o WhatsApp.");
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("email", "Ingresa un correo válido.");
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
    ["Teléfono", "telefono"],
    ["Correo", "email"],
    ["Edad", "edad"],
    ["Región", "region"],
    ["Sistema actual", "sistema"],
    ["Isapre actual", "isapreActual"],
    ["Asesoría AFP", "afp"],
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

async function supabaseRequest(path, { method = "GET", body, prefer } = {}) {
  if (!SITE_CONFIG.supabaseUrl || !SITE_CONFIG.supabaseKey) {
    throw new Error("Supabase no está configurado.");
  }

  const headers = {
    apikey: SITE_CONFIG.supabaseKey,
    Authorization: `Bearer ${SITE_CONFIG.supabaseKey}`,
    Accept: "application/json",
  };

  if (body) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(`${SITE_CONFIG.supabaseUrl}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Error Supabase ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function submitLeadToSupabase(formData) {
  const lead = {
    name: getValue(formData, "nombre"),
    phone: getValue(formData, "telefono"),
    email: nullableValue(formData, "email"),
    age: parseOptionalInteger(getValue(formData, "edad")),
    region: nullableValue(formData, "region"),
    comuna: nullableValue(formData, "comuna"),
    current_system: nullableValue(formData, "sistema"),
    current_isapre: nullableValue(formData, "isapreActual"),
    income: nullableValue(formData, "renta"),
    dependents: parseOptionalInteger(getValue(formData, "cargas")),
    afp_advice: nullableValue(formData, "afp"),
    comment: nullableValue(formData, "comentario"),
    source: "landing",
    page_url: window.location.href,
    user_agent: navigator.userAgent,
    raw_payload: formPayload(formData),
  };

  return supabaseRequest("leads", {
    method: "POST",
    body: lead,
    prefer: "return=minimal",
  });
}

function setTestimonialError(fieldName, message) {
  const field = document.querySelector(`#${fieldName}`);
  const error = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (!field || !error) return;

  field.closest(".form-row")?.classList.toggle("is-invalid", Boolean(message));
  error.textContent = message;
}

function clearTestimonialErrors() {
  ["reviewName", "reviewRating", "reviewComment", "reviewConsent"].forEach((name) =>
    setTestimonialError(name, "")
  );
  testimonialStatus?.classList.remove("success", "error");
}

function publicName(fullName) {
  const parts = stripHtml(fullName).split(/\s+/).filter(Boolean);
  if (!parts.length) return "Cliente TuPlanFácil";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}

function clampRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 5;
  return Math.min(5, Math.max(1, Math.round(rating)));
}

function getStoredTestimonials() {
  try {
    return JSON.parse(localStorage.getItem(SITE_CONFIG.testimonialsStorageKey) || "[]");
  } catch (_) {
    return [];
  }
}

function saveStoredTestimonials(testimonials) {
  try {
    localStorage.setItem(
      SITE_CONFIG.testimonialsStorageKey,
      JSON.stringify(testimonials.slice(0, SITE_CONFIG.maxVisibleTestimonials))
    );
  } catch (_) {
    // Si localStorage no esta disponible, solo mostramos el comentario en la sesion actual.
  }
}

function normalizeTestimonial(item) {
  return {
    id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: publicName(item.name || item.nombre || item.public_name || item.publicName || ""),
    context: stripHtml(item.context || item.contexto || "Cliente TuPlanFácil").slice(0, 90),
    rating: clampRating(item.rating || item.calificacion || 5),
    comment: stripHtml(item.comment || item.comentario || "").slice(0, 420),
  };
}

function testimonialKey(item) {
  return `${item.name}|${item.context}|${item.comment}`.toLowerCase();
}

function mergeTestimonials(...groups) {
  const seen = new Set();
  return groups
    .flat()
    .map(normalizeTestimonial)
    .filter((item) => item.comment)
    .filter((item) => {
      const key = testimonialKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, SITE_CONFIG.maxVisibleTestimonials);
}

function createTestimonialCard(testimonial) {
  const card = document.createElement("blockquote");
  card.className = "testimonial-card";

  const stars = document.createElement("div");
  stars.className = "testimonial-stars";
  stars.setAttribute("aria-label", `${testimonial.rating} de 5 estrellas`);
  stars.textContent = "★".repeat(testimonial.rating);

  const quote = document.createElement("p");
  quote.textContent = testimonial.comment;

  const footer = document.createElement("footer");
  const name = document.createElement("strong");
  name.textContent = testimonial.name;
  const context = document.createElement("span");
  context.textContent = testimonial.context;

  footer.append(name, context);
  card.append(stars, quote, footer);
  return card;
}

function renderTestimonials(testimonials) {
  if (!testimonialList) return;

  testimonialList.innerHTML = "";
  if (!testimonials.length) {
    const empty = document.createElement("article");
    empty.className = "testimonial-card testimonial-empty";
    empty.innerHTML = `
      <p>Estamos reuniendo recomendaciones reales de clientes. Sé la primera persona en dejar tu experiencia.</p>
      <footer>
        <strong>TuPlanFácil</strong>
        <span>Comentarios verificados por autorización</span>
      </footer>
    `;
    testimonialList.append(empty);
    return;
  }

  testimonials.forEach((testimonial) => testimonialList.append(createTestimonialCard(testimonial)));
}

async function loadTestimonialsFromSupabase() {
  if (!testimonialList) return;

  try {
    const remote = await supabaseRequest(
      "testimonials?select=id,created_at,public_name,context,rating,comment&order=created_at.desc&limit=12"
    );
    const merged = mergeTestimonials(remote || [], getStoredTestimonials(), SITE_CONFIG.defaultTestimonials);
    renderTestimonials(merged);
  } catch (err) {
    console.warn("No se pudieron cargar opiniones desde Supabase:", err);
  }
}

function buildTestimonial(formData) {
  return normalizeTestimonial({
    id: `${Date.now()}`,
    name: getValue(formData, "reviewName"),
    context: getValue(formData, "reviewContext") || "Cliente TuPlanFácil",
    rating: getValue(formData, "reviewRating"),
    comment: getValue(formData, "reviewComment"),
  });
}

function validateTestimonial(formData) {
  let valid = true;

  if (!getValue(formData, "reviewName")) {
    setTestimonialError("reviewName", "Ingresa tu nombre.");
    valid = false;
  }
  if (!getValue(formData, "reviewRating")) {
    setTestimonialError("reviewRating", "Selecciona una calificación.");
    valid = false;
  }
  if (getValue(formData, "reviewComment").length < 12) {
    setTestimonialError("reviewComment", "Escribe un comentario un poco más completo.");
    valid = false;
  }
  if (formData.get("reviewConsent") !== "si") {
    setTestimonialError("reviewConsent", "Necesitamos tu autorización para publicarlo.");
    valid = false;
  }

  return valid;
}

async function submitTestimonialToSupabase(testimonial) {
  const payload = {
    public_name: testimonial.name,
    context: testimonial.context,
    rating: testimonial.rating,
    comment: testimonial.comment,
    consent: true,
    is_published: true,
    source: "landing",
    user_agent: navigator.userAgent,
    raw_payload: {
      page_url: window.location.href,
      submitted_at: new Date().toISOString(),
    },
  };

  const rows = await supabaseRequest("testimonials", {
    method: "POST",
    body: payload,
    prefer: "return=representation",
  });

  return Array.isArray(rows) && rows[0] ? normalizeTestimonial(rows[0]) : testimonial;
}

navToggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) closeMobileNav();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileNav();
});

document.querySelector("[data-faq-list]")?.addEventListener(
  "toggle",
  (event) => {
    const activeItem = event.target;
    if (!(activeItem instanceof HTMLDetailsElement) || !activeItem.open) return;
    document.querySelectorAll(".faq-item[open]").forEach((item) => {
      if (item !== activeItem) item.removeAttribute("open");
    });
  },
  true
);

if (
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
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
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
}

leadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFormErrors();

  const formData = new FormData(leadForm);

  // Honeypot: bots llenan este campo, humanos no
  if (formData.get("website")) return;

  // Cooldown: evita envíos repetidos en menos de 60 segundos
  const now = Date.now();
  if (now - lastSubmitTime < SITE_CONFIG.submitCooldownMs) {
    formStatus.textContent = "Espera un momento antes de volver a enviar.";
    formStatus.classList.add("error");
    return;
  }

  if (!validateForm(formData)) {
    formStatus.textContent = "Revisa los campos marcados y vuelve a intentar.";
    formStatus.classList.add("error");
    return;
  }

  const submitBtn = leadForm.querySelector(".submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";
  }

  lastSubmitTime = now;

  try {
    await submitLeadToSupabase(formData);
  } catch (err) {
    // WhatsApp sigue siendo la conversión principal; registramos el error sin bloquear al usuario.
    console.warn("No se pudo guardar el lead en Supabase:", err);
  }

  window.open(whatsappUrl(buildLeadSummary(formData)), "_blank", "noopener");

  formStatus.textContent = "¡Gracias! Recibimos tus datos y te contactaremos pronto para revisar tu caso.";
  formStatus.classList.add("success");

  leadForm.reset();

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar solicitud";
  }
});

leadForm?.addEventListener("input", () => {
  formStatus.classList.remove("success", "error");
});

testimonialForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearTestimonialErrors();

  const formData = new FormData(testimonialForm);

  // Honeypot: si un bot completa este campo oculto, no publicamos nada.
  if (formData.get("reviewWebsite")) return;

  if (!validateTestimonial(formData)) {
    testimonialStatus.textContent = "Revisa los campos marcados y vuelve a intentar.";
    testimonialStatus.classList.add("error");
    return;
  }

  const submitBtn = testimonialForm.querySelector(".testimonial-submit");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Publicando…";
  }

  try {
    const testimonial = buildTestimonial(formData);
    const savedTestimonial = await submitTestimonialToSupabase(testimonial);
    const current = mergeTestimonials(
      [savedTestimonial],
      getStoredTestimonials(),
      SITE_CONFIG.defaultTestimonials
    );

    saveStoredTestimonials(current);
    renderTestimonials(current);

    testimonialStatus.textContent =
      "Comentario publicado. Gracias por ayudar a otras personas a decidir mejor.";
    testimonialStatus.classList.add("success");
    testimonialForm.reset();
  } catch (err) {
    console.warn("No se pudo publicar la opinión:", err);
    testimonialStatus.textContent =
      "No pudimos publicar tu comentario en este momento. Inténtalo nuevamente.";
    testimonialStatus.classList.add("error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Publicar comentario";
    }
  }
});

testimonialForm?.addEventListener("input", () => {
  testimonialStatus?.classList.remove("success", "error");
});

renderTestimonials(mergeTestimonials(getStoredTestimonials(), SITE_CONFIG.defaultTestimonials));
loadTestimonialsFromSupabase();
syncWhatsappLinks();
