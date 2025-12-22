var scroll = document.querySelector(".scroll-mark");

document.addEventListener("wheel", (e) => {
  if (scroll && e.deltaY >= 0) {
    scroll.remove();
  }
});