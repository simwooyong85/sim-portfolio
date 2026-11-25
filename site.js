const intro = document.querySelector("[data-intro]");
if (intro && !matchMedia("(prefers-reduced-motion: reduce)").matches && !navigator.connection?.saveData) {
  const watcher = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    watcher.disconnect();
    intro.src = intro.dataset.intro;
    intro.muted = true;
    intro.play().catch(() => {});
  }, {threshold:.45});
  const stopIntro = () => {
    intro.classList.remove("active");
    intro.removeAttribute("src");
    intro.load();
  };
  intro.addEventListener("playing", () => intro.classList.add("active"), {once:true});
  intro.addEventListener("ended", stopIntro, {once:true});
  intro.addEventListener("error", stopIntro, {once:true});
  watcher.observe(intro.parentElement);
}
for (const comparison of document.querySelectorAll("[data-compare]")) {
  comparison.addEventListener("click", event => {
    const choice = event.target.closest("[data-choice]");
    if (!choice) return;
    for (const button of comparison.querySelectorAll("[data-choice]")) button.setAttribute("aria-pressed", String(choice === button));
    for (const panel of comparison.querySelectorAll("[data-panel]")) panel.hidden = panel.dataset.panel !== choice.dataset.choice;
  });
}
function play(anchor, full) {
  const figure = anchor.closest("figure");
  const stage = figure.querySelector(".video-stage");
  const trigger = stage.querySelector("[data-video]");
  const video = stage.querySelector("video") || document.createElement("video");
  const start = !full && trigger?.dataset.start;
  const end = !full && Number(trigger?.dataset.end);
  video.controls = true;
  video.playsInline = true;
  video.preload = "none";
  video.setAttribute("aria-label", trigger?.getAttribute("aria-label") || "작업 영상");
  video.src = (full ? anchor.href : trigger.dataset.video) + (start ? "#t=" + start : "");
  video.ontimeupdate = end ? () => {
    if (video.currentTime >= end && video.currentTime < end + .35) {
      video.pause();
      video.ontimeupdate = null;
    }
  } : null;
  video.onplay = () => {
    for (const other of document.querySelectorAll(".video-stage video")) if (other !== video) other.pause();
  };
  video.onerror = () => {
    const fallback = trigger || document.createElement("a");
    fallback.href ||= anchor.href;
    fallback.textContent = "영상 파일 열기";
    fallback.removeAttribute("data-video");
    stage.replaceChildren(fallback);
  };
  stage.replaceChildren(video);
  video.focus({preventScroll:true});
  video.play().catch(() => {});
}
document.addEventListener("click", event => {
  const anchor = event.target.closest("a");
  if (!anchor || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (anchor.hasAttribute("data-video") || anchor.hasAttribute("data-full")) {
    event.preventDefault();
    play(anchor, anchor.hasAttribute("data-full"));
  }
  if (anchor.hasAttribute("data-still") && typeof HTMLDialogElement !== "undefined") {
    event.preventDefault();
    const dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label","작업 이미지");
    const close = document.createElement("button");
    close.textContent = "닫기";
    close.onclick = () => dialog.close();
    const image = anchor.querySelector("img").cloneNode();
    image.loading = "eager";
    dialog.append(close,image);
    document.body.append(dialog);
    dialog.addEventListener("close",()=>{dialog.remove();anchor.focus({preventScroll:true});},{once:true});
    dialog.showModal();
  }
});
