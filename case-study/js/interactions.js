(() => {
  "use strict";

  const screens = window.AERIS_SCREENS || [];
  const base = "./assets/screenshots/";

  // Interactive device navigator
  const deviceImage = document.querySelector("[data-device-image]");
  const deviceTitle = document.querySelector("[data-device-title]");
  const deviceCopy = document.querySelector("[data-device-copy]");
  const deviceCounter = document.querySelector(".device-counter");
  const deviceSelect = document.querySelector("[data-device-select]");
  let deviceIndex = 0;

  deviceSelect.innerHTML = screens.map((screen, index) => `<option value="${index}">${String(index + 1).padStart(2, "0")} · ${screen.title}</option>`).join("");
  const showDeviceScreen = (index) => {
    deviceIndex = (index + screens.length) % screens.length;
    const screen = screens[deviceIndex];
    deviceImage.classList.add("changing");
    window.setTimeout(() => {
      deviceImage.src = `${base}${screen.image}`;
      deviceImage.alt = `${screen.title} app screen`;
      deviceTitle.textContent = screen.title;
      deviceCopy.textContent = screen.purpose;
      deviceCounter.textContent = `${String(deviceIndex + 1).padStart(2, "0")} / ${String(screens.length).padStart(2, "0")}`;
      deviceSelect.value = String(deviceIndex);
      deviceImage.classList.remove("changing");
    }, 150);
  };
  document.querySelector("[data-device-prev]").addEventListener("click", () => showDeviceScreen(deviceIndex - 1));
  document.querySelector("[data-device-next]").addEventListener("click", () => showDeviceScreen(deviceIndex + 1));
  deviceSelect.addEventListener("change", () => showDeviceScreen(Number(deviceSelect.value)));

  // Theme screenshot comparison
  const themeImage = document.querySelector("[data-theme-image]");
  const themeSwatches = document.querySelectorAll(".theme-token-stack span");
  const themeTokens = {
    light: ["#f3f8f5", "#ddf4e7", "#16865b", "#18352a"],
    dark: ["#07111f", "#0b1728", "#50d7e5", "#f4f8fc"],
  };
  document.querySelector(".theme-switch").addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-shot]");
    if (!button) return;
    const theme = button.dataset.themeShot;
    document.querySelectorAll("[data-theme-shot]").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    themeImage.classList.add("changing");
    window.setTimeout(() => {
      themeImage.src = `${base}home-${theme}.png`;
      themeImage.alt = `Home dashboard in ${theme} theme`;
      themeTokens[theme].forEach((value, index) => themeSwatches[index].style.setProperty("--swatch", value));
      themeImage.classList.remove("changing");
    }, 170);
  });

  // Journey explorer
  const journey = [
    { title: "Recognize a care need", goal: "Decide whether a consultation is appropriate.", action: "Considers symptoms and the need for professional care.", question: "Which service should I use?", friction: "The correct path may be unclear.", response: "The dashboard uses plain-language service shortcuts and search." },
    { title: "Open the app", goal: "Understand the available care options quickly.", action: "Arrives at Home and scans the service hierarchy.", question: "Where do I start?", friction: "Dense dashboards can obscure primary actions.", response: "Four service cards establish a clear first decision." },
    { title: "Find Doctors", goal: "Enter the consultation journey.", action: "Selects Doctors from Home or bottom navigation.", question: "Can I find the right specialty?", friction: "Unclear labels can increase uncertainty.", response: "Doctor discovery is a labeled primary destination." },
    { title: "Search and filter", goal: "Narrow fictional profiles to a relevant option.", action: "Uses search, specialty, availability, and visit-mode filters.", question: "Who is available soon?", friction: "Too many filters may create extra work.", response: "Common specialties stay visible; secondary filters live in a sheet." },
    { title: "Review a profile", goal: "Understand fit, format, price, and availability.", action: "Reads sample context and next open dates.", question: "Is this profile trustworthy?", friction: "Unverified credentials could mislead.", response: "The profile is explicitly labeled fictional and avoids clinical claims." },
    { title: "Choose a time", goal: "Select a convenient open slot.", action: "Picks a date, time, and consultation mode.", question: "What have I selected?", friction: "Selected states may be easy to miss.", response: "Date, time, and mode use clear selected states and a live summary." },
    { title: "Review and confirm", goal: "Understand the commitment before continuing.", action: "Checks date, time, type, and sample price.", question: "Is this a real booking?", friction: "Prototype success can be mistaken for a real provider action.", response: "The action says “demo booking” and the confirmation explains it was not sent." },
    { title: "Understand next steps", goal: "Know what happens after confirmation.", action: "Views the detail sheet or returns Home.", question: "Where is my appointment?", friction: "Status can become hidden after confirmation.", response: "The appointment appears on Home and in a persistent detail sheet." },
    { title: "Join the consultation", goal: "Enter the call experience at the right time.", action: "Starts a clearly simulated video interface.", question: "Is my camera active?", friction: "Permission and connection states may feel risky.", response: "The UI says no camera, microphone, or real network call is used." },
    { title: "Finish the session", goal: "Exit without losing context.", action: "Confirms the end action and sees a summary.", question: "Did the call actually happen?", friction: "A false success could imply care was delivered.", response: "The final state repeats that the session was simulated." },
  ];
  const stageHost = document.querySelector(".journey-stages");
  const detailHost = document.querySelector(".journey-detail");
  stageHost.innerHTML = journey.map((item, index) => `<button type="button" role="tab" aria-selected="${index === 0}" data-journey="${index}" class="${index === 0 ? "active" : ""}"><span>${String(index + 1).padStart(2, "0")}</span><b>${item.title}</b><i>→</i></button>`).join("");
  const showJourney = (index) => {
    const item = journey[index];
    detailHost.innerHTML = `
      <span>STAGE ${String(index + 1).padStart(2, "0")} · PROPOSED JOURNEY</span>
      <h3>${item.title}</h3>
      <dl>
        <div><dt>User goal</dt><dd>${item.goal}</dd></div>
        <div><dt>Action</dt><dd>${item.action}</dd></div>
        <div><dt>Question to validate</dt><dd>${item.question}</dd></div>
        <div><dt>Potential friction</dt><dd>${item.friction}</dd></div>
        <div><dt>Design response</dt><dd>${item.response}</dd></div>
        <div><dt>Evidence status</dt><dd>Hypothesis pending user research and usability testing.</dd></div>
      </dl>`;
  };
  stageHost.addEventListener("click", (event) => {
    const button = event.target.closest("[data-journey]");
    if (!button) return;
    stageHost.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-selected", String(item === button));
    });
    showJourney(Number(button.dataset.journey));
  });
  showJourney(0);

  // User flow diagrams
  const flows = {
    doctor: [
      ["Home", "Service entry"], ["Doctor list", "Search + filters"], ["Profile", "Fictional context"],
      ["Booking", "Date + time"], ["Confirmation", "Demo outcome"], ["Video", "Simulated call"],
    ],
    pharmacy: [
      ["Home", "Service entry"], ["Pharmacy", "Search + categories"], ["Product", "Sample detail"],
      ["Cart", "Quantities + fees"], ["Summary", "No payment"],
    ],
    lab: [
      ["Home", "Service entry"], ["Lab tests", "Search + categories"], ["Test detail", "Preparation note"],
      ["Booking", "Collection + time"], ["Status", "Not sent to lab"],
    ],
    records: [
      ["Home", "Recent shortcut"], ["Records", "Search + categories"], ["Report", "Sample preview"],
      ["Metadata", "Profile + date"], ["Records", "Predictable return"],
    ],
  };
  const flowHost = document.querySelector(".flow-diagram");
  const showFlow = (key) => {
    flowHost.innerHTML = flows[key].map((node, index) => `${index ? '<span class="flow-arrow">→</span>' : ""}<button class="flow-node ${index === flows[key].length - 1 ? "outcome" : ""}" type="button" title="${node[1]}"><strong>${node[0]}</strong><small>${node[1]}</small></button>`).join("");
  };
  document.querySelector(".flow-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-flow]");
    if (!button) return;
    document.querySelectorAll("[data-flow]").forEach((item) => item.classList.toggle("active", item === button));
    showFlow(button.dataset.flow);
  });
  showFlow("doctor");

  // Conceptual wireframe reconstruction
  const wireframes = [
    { key: "home", title: "Home Dashboard", purpose: "Prioritize service discovery, the next appointment, recent records, and emergency access.", decision: "The dashboard uses four equal service shortcuts but gives the appointment card greater visual weight." },
    { key: "doctors", title: "Doctor Listing", purpose: "Support search, filtering, and quick profile comparison.", decision: "Search and specialty chips stay above a vertically scannable card list." },
    { key: "booking", title: "Appointment Booking", purpose: "Create a predictable date, time, and review sequence.", decision: "Selection happens in one scroll with a summary immediately before confirmation." },
    { key: "video", title: "Video Consultation", purpose: "Keep call controls reachable and status unmistakable.", decision: "Participant content occupies the stage while three labeled controls anchor the bottom." },
    { key: "records", title: "Health Records", purpose: "Make record type, recency, and profile identity easy to scan.", decision: "Category counts and search sit above a compact metadata-rich list." },
  ];
  const wireframeTabs = document.querySelector(".wireframe-tabs");
  const wireframeStage = document.querySelector(".wireframe-stage");
  const wireframeCaption = document.querySelector(".wireframe-caption");
  wireframeTabs.innerHTML = wireframes.map((item, index) => `<button type="button" data-wireframe="${item.key}" class="${index === 0 ? "active" : ""}">${item.title}</button>`).join("");
  const wireframeMarkup = (key) => {
    const header = `<div class="wf-top"><div><i class="wf-line dark mid"></i><i class="wf-line short"></i></div><i class="wf-avatar"></i></div>`;
    const nav = `<div class="wf-nav"><i></i><i></i><i></i><i></i><i></i></div>`;
    if (key === "home") return `<div class="wireframe-phone">${header}<div class="wf-search"><i class="wf-icon"></i><i class="wf-line"></i></div><div class="wf-grid"><i class="wf-card"><b class="wf-icon"></b></i><i class="wf-card"><b class="wf-icon"></b></i><i class="wf-card"><b class="wf-icon"></b></i><i class="wf-card"><b class="wf-icon"></b></i></div><div class="wf-feature"><i class="wf-line short"></i><div class="wf-row"><i class="wf-avatar"></i><i class="wf-line"></i></div><i class="wf-button"></i></div>${nav}</div>`;
    if (key === "doctors") return `<div class="wireframe-phone">${header}<div class="wf-search"><i class="wf-icon"></i><i class="wf-line"></i></div><div class="wf-row"><i class="wf-line"></i><i class="wf-line"></i><i class="wf-line"></i></div><div class="wf-list"><i class="wf-card"><b class="wf-avatar"></b><b class="wf-line"></b></i><i class="wf-card"><b class="wf-avatar"></b><b class="wf-line"></b></i><i class="wf-card"><b class="wf-avatar"></b><b class="wf-line"></b></i><i class="wf-card"><b class="wf-avatar"></b><b class="wf-line"></b></i></div>${nav}</div>`;
    if (key === "booking") return `<div class="wireframe-phone">${header}<i class="wf-line dark mid"></i><div class="wf-feature"><div class="wf-row"><i class="wf-card"></i><i class="wf-card"></i><i class="wf-card"></i><i class="wf-card"></i></div></div><div class="wf-grid"><i class="wf-button"></i><i class="wf-button"></i><i class="wf-button"></i><i class="wf-button"></i></div><div class="wf-feature"><i class="wf-line short"></i><i class="wf-line mid"></i></div><i class="wf-button"></i></div>`;
    if (key === "video") return `<div class="wireframe-phone"><div class="wf-video"></div><div class="wf-controls"><i></i><i></i><i></i></div></div>`;
    return `<div class="wireframe-phone">${header}<div class="wf-search"><i class="wf-icon"></i><i class="wf-line"></i></div><div class="wf-grid"><i class="wf-card"></i><i class="wf-card"></i></div><div class="wf-list"><i class="wf-card"><b class="wf-icon"></b><b class="wf-line"></b></i><i class="wf-card"><b class="wf-icon"></b><b class="wf-line"></b></i><i class="wf-card"><b class="wf-icon"></b><b class="wf-line"></b></i></div>${nav}</div>`;
  };
  const showWireframe = (key) => {
    const item = wireframes.find((entry) => entry.key === key);
    wireframeStage.innerHTML = wireframeMarkup(key);
    wireframeCaption.innerHTML = `<span>CONCEPTUAL RECONSTRUCTION</span><h3>${item.title}</h3><p><strong>Purpose:</strong> ${item.purpose}</p><p><strong>Key decision:</strong> ${item.decision}</p>`;
  };
  wireframeTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-wireframe]");
    if (!button) return;
    wireframeTabs.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    showWireframe(button.dataset.wireframe);
  });
  showWireframe("home");

  // Guided walkthroughs
  const walkthroughs = {
    doctor: ["home-light", "doctors", "doctor-profile", "appointment-booking", "booking-confirmation"],
    pharmacy: ["home-light", "pharmacy", "product-details", "cart"],
    lab: ["home-light", "lab-tests", "lab-booking", "booking-confirmation"],
    records: ["home-light", "health-records", "report-details"],
  };
  const walkthroughHost = document.querySelector(".walkthrough-track");
  const showWalkthrough = (key) => {
    const ids = walkthroughs[key];
    walkthroughHost.innerHTML = ids.map((id, index) => {
      const screen = screens.find((entry) => entry.id === id);
      return `<article class="walkthrough-step"><div class="walkthrough-frame"><img src="${base}${screen.image}" alt="${screen.title} screen" loading="lazy" width="390" height="844"></div><span>STEP ${String(index + 1).padStart(2, "0")}</span><strong>${screen.title}</strong><p>${screen.purpose}</p></article>`;
    }).join("");
  };
  document.querySelector(".walkthrough-nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-walkthrough]");
    if (!button) return;
    document.querySelectorAll("[data-walkthrough]").forEach((item) => item.classList.toggle("active", item === button));
    showWalkthrough(button.dataset.walkthrough);
  });
  showWalkthrough("doctor");
})();
