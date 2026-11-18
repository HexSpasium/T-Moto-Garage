if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/T-Moto-Garage/sw.js", { scope: "/T-Moto-Garage/" }).catch(() => {});
  });
}