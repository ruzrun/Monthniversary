document.addEventListener("DOMContentLoaded", () => {
  // ===== Elements =====
  const entryScreen = document.getElementById("entry-screen");
  const startBtn = document.getElementById("start-btn");
  const mainContent = document.getElementById("main-content");
  const container = document.getElementById("messages-container");
  const modal = document.getElementById("modal");
  const modalDate = document.getElementById("modal-date");
  const modalMessage = document.getElementById("modal-message");
  const closeBtn = document.getElementById("close-modal");
  const audio = document.getElementById("bg-music");
  const playBtn = document.getElementById("play-btn");
  const iconPlay = document.getElementById("icon-play");
  const iconPause = document.getElementById("icon-pause");
  const volumeSlider = document.getElementById("volume-slider");
  const canvas = document.getElementById("dust-canvas");
  const ctx = canvas.getContext("2d");

  const MAX_VISIBLE = 10;
  let started = false;
  let isPlaying = false;

  // ===== Dust particles (soft grey floating dust) =====
  let particles = [];
  const PARTICLE_COUNT = 55;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.2 + 0.6,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.35,
        opacity: Math.random() * 0.35 + 0.08
      });
    }
  }

  function drawDust() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(140, 138, 150, ${p.opacity})`;
      ctx.fill();

      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < -5) p.x = canvas.width + 5;
      if (p.x > canvas.width + 5) p.x = -5;
      if (p.y < -5) p.y = canvas.height + 5;
      if (p.y > canvas.height + 5) p.y = -5;
    });
    requestAnimationFrame(drawDust);
  }

  resizeCanvas();
  createParticles();
  drawDust();
  window.addEventListener("resize", () => {
    resizeCanvas();
    createParticles();
  });

  // ===== Entry → Start =====
  startBtn.addEventListener("click", () => {
    if (started) return;
    started = true;

    entryScreen.classList.add("fade-out");
    mainContent.classList.remove("hidden-start");
    mainContent.classList.add("visible");

    setTimeout(() => {
      loadMessages();
    }, 600);

    tryPlayMusic();
  });

  // ===== Music controls =====
  audio.volume = parseFloat(volumeSlider.value);

  function updatePlayIcon() {
    if (isPlaying) {
      iconPlay.style.display = "none";
      iconPause.style.display = "block";
    } else {
      iconPlay.style.display = "block";
      iconPause.style.display = "none";
    }
  }

  function tryPlayMusic() {
    audio.play()
      .then(() => {
        isPlaying = true;
        updatePlayIcon();
      })
      .catch(() => {
        isPlaying = false;
        updatePlayIcon();
      });
  }

  playBtn.addEventListener("click", () => {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      audio.play()
        .then(() => { isPlaying = true; })
        .catch(() => { isPlaying = false; });
    }
    updatePlayIcon();
  });

  volumeSlider.addEventListener("input", () => {
    audio.volume = parseFloat(volumeSlider.value);
  });

  // ===== Messages =====
  function loadMessages() {
    fetch("messages.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load messages.json");
        return res.json();
      })
      .then((messages) => {
        if (!Array.isArray(messages) || messages.length === 0) return;
        startFloating(messages);
      })
      .catch((err) => {
        console.error(err);
        startFloating([
          { date: "2026-05-09", message: "Happy 3-month anniversary!" }
        ]);
      });
  }

  function startFloating(messages) {
    for (let i = 0; i < MAX_VISIBLE; i++) {
      createFloatingBlock(messages, i * 700);
    }
  }

  function createFloatingBlock(messages, delay = 0) {
    setTimeout(() => {
      const data = messages[Math.floor(Math.random() * messages.length)];
      const block = document.createElement("div");
      block.className = "message-block";

      // Top row: date + optional small image
      const topRow = document.createElement("div");
      topRow.className = "top-row";

      const dateEl = document.createElement("div");
      dateEl.className = "date";
      dateEl.textContent = "date: " + data.date;
      topRow.appendChild(dateEl);

      // Optional image (only if provided in JSON)
      if (data.image) {
        const img = document.createElement("img");
        img.className = "card-img";
        img.src = data.image;
        img.alt = "";
        img.loading = "lazy";
        topRow.appendChild(img);
      }

      // Full-width divider
      const divider = document.createElement("div");
      divider.className = "divider";

      const textEl = document.createElement("div");
      textEl.className = "text";
      textEl.textContent = data.message;

      block.appendChild(topRow);
      block.appendChild(divider);
      block.appendChild(textEl);

      const topPercent = 12 + Math.random() * 62;
      block.style.top = topPercent + "%";

      const goRight = Math.random() > 0.5;
      const startX = goRight ? -300 : window.innerWidth + 20;
      block.style.left = startX + "px";

      const speed = 22 + Math.random() * 40;
      const drift = (Math.random() - 0.5) * 0.12;

      container.appendChild(block);

      block.addEventListener("click", () => {
        openModal(data.date, data.message);
      });

      let x = startX;
      let lastTime = performance.now();

      function animate(now) {
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        x += (goRight ? 1 : -1) * speed * dt;
        block.style.left = x + "px";

        const currentTop = parseFloat(block.style.top);
        block.style.top = (currentTop + drift * dt) + "%";

        const blockWidth = block.offsetWidth || 270;
        const offScreen =
          (goRight && x > window.innerWidth + 40) ||
          (!goRight && x < -blockWidth - 40);

        if (offScreen) {
          block.remove();
          createFloatingBlock(messages, 300 + Math.random() * 1000);
          return;
        }

        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    }, delay);
  }

  // ===== Modal =====
  function openModal(date, message) {
    modalDate.textContent = "date: " + date;
    modalMessage.textContent = message;
    modal.classList.remove("hidden");
  }

  function closeModal() {
    modal.classList.add("hidden");
  }

  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
});
