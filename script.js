document.addEventListener("DOMContentLoaded", () => {

  // Animasi masuk ringan saat elemen mulai terlihat di layar
  const revealTargets = document.querySelectorAll(
    ".feature-card, .inventory-card, .team-card, .benefit-card, .roadmap-item, .report-form, .feedback-form"
  );
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealTargets.forEach(el => el.classList.add("reveal-ready"));
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(el => revealObserver.observe(el));
  }

  // Bayangan header bertambah saat halaman digulir
  const header = document.querySelector(".site-header");
  const updateHeader = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // Navigasi seluler
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.textContent = open ? "×" : "☰";
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "☰";
    }));
  }

  // Pencarian, filter, dan detail katalog perangkat
  const cards = [...document.querySelectorAll(".inventory-card")];
  const search = document.querySelector("#device-search");
  const filterButtons = [...document.querySelectorAll(".filter-btn")];
  const count = document.querySelector("#device-count");
  const empty = document.querySelector("#empty-state");
  let activeFilter = "Semua";

  function filterDevices() {
    const keyword = (search?.value || "").toLowerCase().trim();
    let visible = 0;
    cards.forEach(card => {
      const matchesText = `${card.dataset.name} ${card.dataset.room} ${card.dataset.number}`.toLowerCase().includes(keyword);
      const matchesStatus = activeFilter === "Semua" || card.dataset.status === activeFilter;
      const show = matchesText && matchesStatus;
      card.hidden = !show;
      if (show) visible++;
    });
    if (count) count.textContent = visible;
    if (empty) empty.hidden = visible > 0;
  }
  search?.addEventListener("input", filterDevices);
  filterButtons.forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle("active", item === button));
    filterDevices();
  }));

  const modal = document.querySelector("#detail-modal");
  const closeModal = () => { if (modal) modal.hidden = true; };
  document.querySelectorAll("[data-detail]").forEach(button => button.addEventListener("click", () => {
    const card = button.closest(".inventory-card");
    if (!card || !modal) return;
    const title = card.dataset.name;
    document.querySelector("#modal-title").textContent = title;
    document.querySelector("#modal-description").textContent = `Informasi contoh untuk perangkat ${title}. Hubungi petugas lab jika kondisi perangkat membutuhkan pemeriksaan.`;
    document.querySelector("#modal-info").innerHTML = `
      <div><span>Kode perangkat</span><strong>${escapeHTML(card.dataset.number)}</strong></div>
      <div><span>Jenis perangkat</span><strong>Komputer</strong></div>`;
    modal.hidden = false;
  }));
  modal?.querySelector(".modal-close")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", event => { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

  // Form laporan: disimpan di localStorage, hanya untuk demo di browser ini
  const reportForm = document.querySelector("#report-form");
  const reportsList = document.querySelector("#reports-list");
  const reportMessage = document.querySelector("#form-message");
  const reportKey = "labcare_demo_reports_v1";
  const getReports = () => {
    try { return JSON.parse(localStorage.getItem(reportKey) || "[]"); }
    catch { return []; }
  };
  const saveReports = reports => {
    try { localStorage.setItem(reportKey, JSON.stringify(reports)); return true; }
    catch { return false; }
  };
  function renderReports() {
    if (!reportsList) return;
    const reports = getReports();
    if (!reports.length) {
      reportsList.innerHTML = '<p class="empty-report">Belum ada laporan tersimpan di browser ini.</p>';
      return;
    }
    reportsList.innerHTML = reports.map(report => `
      <article class="report-item">
        <div><h3>${escapeHTML(report.perangkat)} · ${escapeHTML(report.kategori)}</h3>
        <p>${escapeHTML(report.deskripsi)}</p><small>Pelapor: ${escapeHTML(report.nama)} · ${escapeHTML(report.waktu)}</small></div>
        <span class="status status-check">Menunggu cek</span>
      </article>`).join("");
  }
  reportForm?.addEventListener("submit", event => {
    event.preventDefault();
    if (!reportForm.reportValidity()) return;
    const formData = new FormData(reportForm);
    const newReport = {
      nama: String(formData.get("nama")).trim(),
      perangkat: String(formData.get("perangkat")).trim(),
      kategori: String(formData.get("kategori")).trim(),
      deskripsi: String(formData.get("deskripsi")).trim(),
      waktu: new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
    };
    if (!newReport.nama || !newReport.perangkat || !newReport.kategori || newReport.deskripsi.length < 8) {
      reportMessage.textContent = "Periksa kembali isian laporan.";
      return;
    }
    const reports = getReports();
    reports.unshift(newReport);
    if (!saveReports(reports)) {
      reportMessage.textContent = "Browser tidak mengizinkan penyimpanan. Coba buka website melalui server lokal.";
      reportMessage.style.color = "#d84d5d";
      return;
    }
    reportMessage.textContent = "Laporan berhasil disimpan di browser ini!";
    reportMessage.style.color = "#29966c";
    reportForm.reset();
    renderReports();
    reportsList?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  document.querySelector("#clear-reports")?.addEventListener("click", () => {
    if (!getReports().length) return;
    if (confirm("Hapus semua laporan demo yang tersimpan di browser ini?")) {
      saveReports([]);
      renderReports();
      if (reportMessage) reportMessage.textContent = "Riwayat demo berhasil dibersihkan.";
    }
  });
  renderReports();

  // Form masukan tim
  const feedbackForm = document.querySelector("#feedback-form");
  feedbackForm?.addEventListener("submit", event => {
    event.preventDefault();
    if (!feedbackForm.reportValidity()) return;
    const name = feedbackForm.querySelector("#feedback-name").value.trim();
    const message = feedbackForm.querySelector("#feedback-message").value.trim();
    let feedbacks = [];
    try { feedbacks = JSON.parse(localStorage.getItem("labcare_demo_feedback_v1") || "[]"); } catch {}
    feedbacks.unshift({ name, message, time: new Date().toLocaleString("id-ID") });
    try {
      localStorage.setItem("labcare_demo_feedback_v1", JSON.stringify(feedbacks));
      document.querySelector("#feedback-status").textContent = "Terima kasih! Masukan tersimpan di browser ini.";
      feedbackForm.reset();
    } catch {
      document.querySelector("#feedback-status").textContent = "Penyimpanan tidak tersedia di browser ini.";
    }
  });

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }
});