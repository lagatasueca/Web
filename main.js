document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  const setTheme = (isDark) => {
    body.classList.toggle("theme-dark", isDark);
    toggle.setAttribute("aria-pressed", String(isDark));
  };

  toggle.addEventListener("click", () => {
    const nextIsDark = !body.classList.contains("theme-dark");
    setTheme(nextIsDark);
  });

  document.querySelectorAll(".more-toggle").forEach((btn) => {
    const targetId = btn.getAttribute("aria-controls");
    const group = targetId ? document.getElementById(targetId) : btn.parentElement?.querySelector(".more-buttons");
    if (!group) return;

    btn.addEventListener("click", () => {
      const isOpen = group.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
      group.setAttribute("aria-hidden", String(!isOpen));
    });
  });

  document.querySelectorAll(".about-inline__photo-button").forEach((button) => {
    button.addEventListener("click", () => {
      const isActive = button.classList.toggle("is-active");
      button.setAttribute("aria-pressed", String(isActive));
    });
  });

  const loadLazyVideo = (video) => {
    if (video.dataset.lazyLoaded === "true") return;
    const src = video.dataset.src;
    if (!src) return;
    video.src = src;
    video.dataset.lazyLoaded = "true";
    video.removeAttribute("data-src");
    video.load();
    if (video.autoplay) {
      video.play().catch(() => {});
    }
  };

  const lazyVideos = Array.from(document.querySelectorAll("video[data-src]"));
  if (lazyVideos.length) {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const video = entry.target;
          loadLazyVideo(video);
          observer.unobserve(video);
        });
      }, { rootMargin: "200px 0px", threshold: 0.01 });

      lazyVideos.forEach((video) => observer.observe(video));
    } else {
      lazyVideos.forEach((video) => loadLazyVideo(video));
    }
  }

  const setupSegmentLoop = (video) => {
    const start = parseFloat(video.dataset.start || "0");
    const end = parseFloat(video.dataset.end || "0");
    if (Number.isNaN(end) || end <= 0) return;

    const pingPong = video.dataset.pingpong === "true";
    const applyLoop = () => {
      video.currentTime = start;

      if (pingPong) {
        video.loop = false;
        let direction = 1; // 1 forward, -1 backward
        const epsilon = 0.003;
        video.playbackRate = 1;

        video.addEventListener("timeupdate", () => {
          if (direction > 0 && video.currentTime >= end - epsilon) {
            direction = -1;
            video.playbackRate = -1;
            video.currentTime = Math.max(start, end - epsilon);
          } else if (direction < 0 && video.currentTime <= start + epsilon) {
            direction = 1;
            video.playbackRate = 1;
            video.currentTime = Math.min(end, start + epsilon);
          }
        });
      } else {
        video.addEventListener("timeupdate", () => {
          if (video.currentTime >= end) {
            video.currentTime = start;
            video.play().catch(() => {});
          }
        });
      }
    };

    if (video.readyState >= 1) {
      applyLoop();
    } else {
      video.addEventListener("loadedmetadata", applyLoop, { once: true });
    }
  };

  document.querySelectorAll("video[data-end]").forEach((video) => {
    setupSegmentLoop(video);
  });

  const sequenceVideos = Array.from(document.querySelectorAll(".sequence-video"));
  if (sequenceVideos.length) {
    const isAutoplay = (vid) => vid.classList.contains("sequence-video--autoplay");
    const blurAll = () => {
      sequenceVideos.forEach((vid) => {
        if (isAutoplay(vid)) {
          vid.classList.remove("video-blurred");
          return;
        }
        vid.classList.add("video-blurred");
      });
    };

    const blurOthers = (active) => {
      sequenceVideos.forEach((vid) => {
        if (isAutoplay(vid)) {
          vid.classList.remove("video-blurred");
          return;
        }
        const isActive = vid === active;
        vid.classList.toggle("video-blurred", !isActive);
        if (!isActive) {
          vid.pause();
          if (vid.readyState > 0) {
            vid.currentTime = 0;
          }
        }
      });
    };

    sequenceVideos.forEach((vid) => {
      vid.loop = true;
      if (isAutoplay(vid)) {
        vid.muted = true;
        vid.playsInline = true;
        vid.autoplay = true;
        if (!vid.dataset.src) {
          vid.play().catch(() => {});
        }
        return;
      }
      vid.addEventListener("mouseenter", () => {
        blurOthers(vid);
        loadLazyVideo(vid);
        vid.play().catch(() => {});
      });
      vid.addEventListener("mouseleave", () => {
        vid.pause();
        if (vid.readyState > 0) {
          vid.currentTime = 0;
        }
        blurAll();
      });
    });

    blurAll();
  }

  document.querySelectorAll(".row-toggle").forEach((button) => {
    const targetId = button.getAttribute("aria-controls");
    const target = targetId ? document.getElementById(targetId) : null;
    const audio = targetId === "back-to-business-details"
      ? document.getElementById("back-to-business-audio")
      : null;
    const muteButton = button.parentElement?.querySelector(".row-mute") || null;
    if (!target) return;

    const updateMuteLabel = () => {
      if (!muteButton || !audio) return;
      const isMuted = audio.muted;
      muteButton.setAttribute("aria-pressed", String(isMuted));
      muteButton.setAttribute("aria-label", isMuted ? "Unmute audio" : "Mute audio");
      muteButton.title = isMuted ? "Unmute audio" : "Mute audio";
    };

    button.addEventListener("click", () => {
      const isOpen = target.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      target.setAttribute("aria-hidden", String(!isOpen));
      if (isOpen) {
        button.textContent = "-";
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
        updateMuteLabel();
      } else {
        button.textContent = "+";
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
    });

    if (muteButton && audio) {
      updateMuteLabel();
      muteButton.addEventListener("click", () => {
        audio.muted = !audio.muted;
        updateMuteLabel();
      });
    }
  });

  const findPreviousDetails = (node) => {
    let current = node.previousElementSibling;
    while (current) {
      if (current.classList.contains("row-details")) {
        return current;
      }
      current = current.previousElementSibling;
    }
    return null;
  };

  const findPreviousLabel = (node) => {
    let current = node.previousElementSibling;
    while (current) {
      if (current.classList.contains("row-label")) {
        return current;
      }
      current = current.previousElementSibling;
    }
    return null;
  };

  const scrollLabelUnderHeader = (label) => {
    if (!label) return;
    const header = document.querySelector(".container");
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const targetTop = label.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  };

  document.querySelectorAll(".item-group").forEach((group) => {
    group.addEventListener("click", (event) => {
      const item = event.target.closest(".item");
      if (!item || !group.contains(item)) return;
      const details = findPreviousDetails(group);
      const label = details ? findPreviousLabel(details) : findPreviousLabel(group);
      if (!details || !details.id) return;
      const toggleButton = document.querySelector(`.row-toggle[aria-controls="${details.id}"]`);
      if (toggleButton) {
        const isOpen = toggleButton.getAttribute("aria-expanded") === "true";
        if (!isOpen) {
          toggleButton.click();
        }
        scrollLabelUnderHeader(label);
      }
    });
  });

  const prettierButton = document.getElementById("prettier-toggle");
  const asciiOverlay = document.getElementById("ascii-overlay");
  const asciiOutput = document.getElementById("ascii-output");

  if (prettierButton && asciiOverlay && asciiOutput && navigator.mediaDevices?.getUserMedia) {
    const asciiChars = ["!", "\"", "&", ",", ";", ":", ".", "*", "\u00A8", "^", "E", "e", "L", "l"];
    const asciiFps = 18;
    let asciiActive = false;
    let asciiStream = null;
    let asciiVideo = null;
    let asciiCanvas = null;
    let asciiContext = null;
    let asciiFrameId = null;
    let lastFrame = 0;

    const getCharMetrics = () => {
      const style = getComputedStyle(asciiOutput);
      const fontSize = parseFloat(style.fontSize);
      const lineHeight = parseFloat(style.lineHeight);
      const charHeight = Number.isFinite(lineHeight) ? lineHeight : fontSize || 8;
      let charWidth = fontSize || 8;

      if (asciiContext) {
        asciiContext.font = `${style.fontSize} ${style.fontFamily}`;
        const measured = asciiContext.measureText("M").width;
        if (Number.isFinite(measured) && measured > 0) {
          charWidth = measured;
        }
      }

      return { charWidth, charHeight };
    };

    const getGridSize = () => {
      const rect = asciiOverlay.getBoundingClientRect();
      const { charWidth, charHeight } = getCharMetrics();
      const cols = Math.max(1, Math.ceil(rect.width / charWidth));
      const rows = Math.max(1, Math.ceil(rect.height / charHeight));
      return { cols, rows };
    };

    const drawCoverFrame = (cols, rows) => {
      const videoWidth = asciiVideo.videoWidth;
      const videoHeight = asciiVideo.videoHeight;
      if (!videoWidth || !videoHeight) return;

      const targetAspect = cols / rows;
      const videoAspect = videoWidth / videoHeight;
      let sx = 0;
      let sy = 0;
      let sw = videoWidth;
      let sh = videoHeight;

      if (videoAspect > targetAspect) {
        sw = Math.round(videoHeight * targetAspect);
        sx = Math.round((videoWidth - sw) / 2);
      } else if (videoAspect < targetAspect) {
        sh = Math.round(videoWidth / targetAspect);
        sy = Math.round((videoHeight - sh) / 2);
      }

      asciiContext.drawImage(asciiVideo, sx, sy, sw, sh, 0, 0, cols, rows);
    };

    const renderAscii = (timestamp) => {
      if (!asciiActive) return;
      asciiFrameId = requestAnimationFrame(renderAscii);
      if (timestamp - lastFrame < 1000 / asciiFps) return;
      lastFrame = timestamp;

      const { cols, rows } = getGridSize();
      if (!asciiContext || !asciiVideo || cols <= 0 || rows <= 0) return;

      if (asciiCanvas.width !== cols || asciiCanvas.height !== rows) {
        asciiCanvas.width = cols;
        asciiCanvas.height = rows;
      }

      drawCoverFrame(cols, rows);
      const pixels = asciiContext.getImageData(0, 0, cols, rows).data;
      const lines = new Array(rows);
      const scale = asciiChars.length - 1;
      let i = 0;

      for (let y = 0; y < rows; y += 1) {
        let line = "";
        for (let x = 0; x < cols; x += 1) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          const adjusted = Math.pow(luminance, 1 / 1.2);
          const idx = Math.min(scale, Math.max(0, Math.round((1 - adjusted) * scale)));
          line += asciiChars[idx];
          i += 4;
        }
        lines[y] = line;
      }

      asciiOutput.textContent = lines.join("\n");
    };

    const stopAscii = () => {
      asciiActive = false;
      body.classList.remove("ascii-active");
      prettierButton.setAttribute("aria-pressed", "false");
      asciiOverlay.classList.remove("is-active");
      asciiOverlay.setAttribute("aria-hidden", "true");
      asciiOutput.textContent = "";

      if (asciiFrameId) {
        cancelAnimationFrame(asciiFrameId);
        asciiFrameId = null;
      }

      if (asciiVideo) {
        asciiVideo.pause();
      }

      if (asciiStream) {
        asciiStream.getTracks().forEach((track) => track.stop());
        asciiStream = null;
      }
    };

    const startAscii = async () => {
      if (asciiActive) return;
      asciiActive = true;
      body.classList.add("ascii-active");
      prettierButton.setAttribute("aria-pressed", "true");
      asciiOverlay.classList.add("is-active");
      asciiOverlay.setAttribute("aria-hidden", "false");

      if (!asciiVideo) {
        asciiVideo = document.createElement("video");
        asciiVideo.setAttribute("playsinline", "");
        asciiVideo.muted = true;
      }

      if (!asciiCanvas) {
        asciiCanvas = document.createElement("canvas");
        asciiContext = asciiCanvas.getContext("2d", { willReadFrequently: true });
      }

      try {
        if (!asciiStream) {
          asciiStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
          });
        }

        asciiVideo.srcObject = asciiStream;
        await asciiVideo.play();
        lastFrame = 0;
        asciiFrameId = requestAnimationFrame(renderAscii);
      } catch (error) {
        stopAscii();
      }
    };

    prettierButton.addEventListener("click", () => {
      if (asciiActive) {
        stopAscii();
      } else {
        startAscii();
      }
    });

    window.addEventListener("pagehide", () => {
      if (asciiActive) stopAscii();
    });
  }

});
