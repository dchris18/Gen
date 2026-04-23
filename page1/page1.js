"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const plots = document.querySelectorAll(".plot");
  const toolCards = document.querySelectorAll(".tool-card");

  const popup = document.getElementById("plantPopup");
  const popupImage = document.getElementById("popupImage");
  const popupTitle = document.getElementById("popupTitle");
  const popupDesc = document.getElementById("popupDesc");

  toolCards.forEach((card) => {
    card.addEventListener("click", () => {
      toolCards.forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");
    });
  });

  plots.forEach((plot) => {
    plot.addEventListener("click", () => {
      plot.classList.toggle("active");

      const img = plot.querySelector("img");
      if (!img) return;

      const name = img.alt;

      popup.classList.add("show");
      popupTitle.textContent = name;

      if (name === "Onion plant") {
        popupImage.src = "../photos/OnionPlant.png";
        popupImage.alt = "Onion plant";
        popupDesc.textContent = "A strong plant that grows well in spring.";
      }

      if (name === "Potato plant") {
        popupImage.src = "../photos/PotatoPlant.png";
        popupImage.alt = "Potato plant";
        popupDesc.textContent = "A hearty crop that grows underground.";
      }

      if (name === "Carrot plant") {
        popupImage.src = "../photos/CarrotPlant.png";
        popupImage.alt = "Carrot plant";
        popupDesc.textContent = "A crunchy vegetable that loves cool soil.";
      }
    });
  });
});