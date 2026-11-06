(() => {
  "use strict";

  const screens = [
    { id: "splash", title: "Splash", category: "auth", image: "splash.png", purpose: "Brand entrance, prototype status, and a controlled transition into onboarding." },
    { id: "welcome", title: "Welcome", category: "auth", image: "welcome.png", purpose: "Introduces the unified care proposition and offers clear account paths." },
    { id: "login", title: "Login", category: "auth", image: "login.png", purpose: "Demo email access, validation, recovery, and honest unconfigured Google sign-in." },
    { id: "create-account", title: "Create Account", category: "auth", image: "create-account.png", purpose: "Account setup with terms, privacy, validation, and demo-state disclosure." },
    { id: "home-light", title: "Home Dashboard", category: "account", image: "home-light.png", purpose: "Service discovery, upcoming care, recent records, emergency access, and navigation." },
    { id: "doctors", title: "Doctor Listing", category: "doctors", image: "doctors.png", purpose: "Search, specialty filters, availability, and fictional profile discovery." },
    { id: "doctor-profile", title: "Doctor Profile", category: "doctors", image: "doctor-profile.png", purpose: "Fictional clinician context, availability, consultation type, and booking entry." },
    { id: "appointment-booking", title: "Appointment Booking", category: "doctors", image: "appointment-booking.png", purpose: "Date, time, consultation type, summary, and explicit simulated confirmation." },
    { id: "booking-confirmation", title: "Booking Confirmation", category: "doctors", image: "booking-confirmation.png", purpose: "A clear demo-success state with next steps and reference details." },
    { id: "video-consultation", title: "Video Consultation", category: "doctors", image: "video-consultation.png", purpose: "A clearly labeled simulated call with mic, camera, and end-call controls." },
    { id: "pharmacy", title: "Pharmacy", category: "commerce", image: "pharmacy.png", purpose: "Fictional product search, categories, recommendations, and cart access." },
    { id: "product-details", title: "Product Details", category: "commerce", image: "product-details.png", purpose: "Product information, quantity control, prototype availability, and add to cart." },
    { id: "cart", title: "Cart & Order Summary", category: "commerce", image: "cart.png", purpose: "Editable quantities, removal, transparent mock fees, and no-payment disclosure." },
    { id: "lab-tests", title: "Lab Tests", category: "commerce", image: "lab-tests.png", purpose: "Search, categories, sample pricing, booking options, and clear caveats." },
    { id: "lab-booking", title: "Lab Test Booking", category: "commerce", image: "lab-booking.png", purpose: "Collection type, date, time window, summary, and sample preparation note." },
    { id: "health-records", title: "Health Records", category: "account", image: "health-records.png", purpose: "Profile context, categories, record search, and private-space explanation." },
    { id: "report-details", title: "Report Details", category: "account", image: "report-details.png", purpose: "Readable sample-document preview with metadata and explicit fictional values." },
    { id: "emergency", title: "Emergency Information", category: "account", image: "emergency.png", purpose: "Direct, calm guidance without invented numbers or emergency-service claims." },
    { id: "notifications", title: "Notifications", category: "account", image: "notifications.png", purpose: "Read/unread states, service updates, timestamps, and preference access." },
    { id: "profile", title: "Profile", category: "account", image: "profile.png", purpose: "Demo identity, profile completeness, records, notifications, privacy, and support." },
    { id: "settings", title: "Settings", category: "account", image: "settings.png", purpose: "Notification, theme, language, text-size, privacy, and local data controls." },
    { id: "help", title: "Help & Support", category: "account", image: "help.png", purpose: "Searchable prototype guidance, service topics, FAQs, and unconnected support." },
  ];

  window.AERIS_SCREENS = screens;
  const base = "./assets/screenshots/";
  const gallery = document.querySelector(".screen-gallery");
  const count = document.querySelector(".gallery-count");
  const lightbox = document.querySelector(".lightbox");
  let activeIndex = 0;
  let visibleScreens = screens;

  const render = (filter = "all") => {
    visibleScreens = filter === "all" ? screens : screens.filter((screen) => screen.category === filter);
    count.textContent = `${visibleScreens.length} ${visibleScreens.length === 1 ? "screen" : "screens"}`;
    gallery.innerHTML = visibleScreens
      .map((screen, index) => `
        <article class="screen-card" data-screen-id="${screen.id}">
          <button class="screen-thumb" type="button" data-gallery-index="${index}" aria-label="Open ${screen.title} preview">
            <img src="${base}${screen.image}" alt="${screen.title} app screen" loading="lazy" width="390" height="844">
          </button>
          <div class="screen-meta">
            <span>${String(screens.indexOf(screen) + 1).padStart(2, "0")} / 22</span>
            <h3>${screen.title}</h3>
            <p>${screen.purpose}</p>
          </div>
        </article>
      `)
      .join("");
  };

  const updateLightbox = () => {
    const screen = visibleScreens[activeIndex];
    const image = lightbox.querySelector("img");
    image.src = `${base}${screen.image}`;
    image.alt = `${screen.title} app screen`;
    lightbox.querySelector(".lightbox-meta > span").textContent = `${String(activeIndex + 1).padStart(2, "0")} OF ${String(visibleScreens.length).padStart(2, "0")}`;
    lightbox.querySelector(".lightbox-meta h3").textContent = screen.title;
    lightbox.querySelector(".lightbox-meta p").textContent = screen.purpose;
    lightbox.querySelector(".lightbox-meta small").textContent = "Actual 390 × 844 application capture";
  };

  const openLightbox = (index) => {
    activeIndex = index;
    updateLightbox();
    lightbox.showModal();
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.close();
    document.body.style.overflow = "";
  };

  const move = (direction) => {
    activeIndex = (activeIndex + direction + visibleScreens.length) % visibleScreens.length;
    updateLightbox();
  };

  document.querySelector(".gallery-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    render(button.dataset.filter);
  });

  gallery.addEventListener("click", (event) => {
    const button = event.target.closest("[data-gallery-index]");
    if (button) openLightbox(Number(button.dataset.galleryIndex));
  });

  lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".prev").addEventListener("click", () => move(-1));
  lightbox.querySelector(".next").addEventListener("click", () => move(1));
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  lightbox.addEventListener("cancel", (event) => { event.preventDefault(); closeLightbox(); });
  document.addEventListener("keydown", (event) => {
    if (!lightbox.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
      return;
    }
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  });

  render();
})();
