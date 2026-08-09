document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("messages-container");
  const modal = document.getElementById("modal");
  const modalDate = document.getElementById("modal-date");
  const modalMessage = document.getElementById("modal-message");
  const closeBtn = document.getElementById("close-modal");

  // How many floating cards to keep on screen at once
  const MAX_VISIBLE = 10;

  // Load messages from JSON
  fetch("messages.json")
    .then((res) => {
      if (!res.ok) throw new Error("Could not load messages.json");
      return res.json();
    })
    .then((messages) => {
      if (!Array.isArray(messages) || messages.length === 0) {
        console.warn("No messages found in JSON");
        return;
      }
      startFloating(messages);
    })
    .catch((err) => {
      console.error(err);
      // Fallback sample so the page still works if JSON fails
      startFloating([
        { date: "2026-05-09", message: "Happy 3-month anniversary!" }
      ]);
    });

  function startFloating(messages) {
    // Create initial set of floating blocks
    for (let i = 0; i < MAX_VISIBLE; i++) {
      createFloatingBlock(messages, i * 800); // staggered start
    }
  }

  function createFloatingBlock(messages, delay = 0) {
    setTimeout(() => {
      const data = messages[Math.floor(Math.random() * messages.length)];
      const block = document.createElement("div");
      block.className = "message-block";

      // Date line
      const dateEl = document.createElement("div");
      dateEl.className = "date";
      dateEl.textContent = "date: " + data.date;

      // Message line
      const textEl = document.createElement("div");
      textEl.className = "text";
      textEl.textContent = data.message;

      block.appendChild(dateEl);
      block.appendChild(textEl);

      // Random vertical position (keep away from very top/bottom)
      const topPercent = 12 + Math.random() * 70; // 12% – 82%
      block.style.top = topPercent + "%";

      // Random direction: left → right or right → left
      const goRight = Math.random() > 0.5;
      const startX = goRight ? -320 : window.innerWidth + 20;
      block.style.left = startX + "px";

      // Random speed (pixels per second)
      const speed = 25 + Math.random() * 45; // 25–70 px/s

      // Slight random vertical drift
      const drift = (Math.random() - 0.5) * 0.15; // small

      container.appendChild(block);

      // Click → open enlarged view
      block.addEventListener("click", () => {
        openModal(data.date, data.message);
      });

      // Animate continuously
      let x = startX;
      let lastTime = performance.now();

      function animate(now) {
        const dt = (now - lastTime) / 1000; // seconds
        lastTime = now;

        x += (goRight ? 1 : -1) * speed * dt;
        block.style.left = x + "px";

        // Soft vertical drift
        const currentTop = parseFloat(block.style.top);
        block.style.top = (currentTop + drift * dt) + "%";

        // When completely off-screen, remove and spawn a new one
        const blockWidth = block.offsetWidth || 280;
        const offScreen =
          (goRight && x > window.innerWidth + 40) ||
          (!goRight && x < -blockWidth - 40);

        if (offScreen) {
          block.remove();
          // Spawn a replacement after a short random pause
          createFloatingBlock(messages, 400 + Math.random() * 1200);
          return;
        }

        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    }, delay);
  }

  // ===== Modal logic =====
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
