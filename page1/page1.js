"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const plots = document.querySelectorAll(".plot");
  const toolCards = document.querySelectorAll(".tool-card");

  toolCards.forEach((card) => {
    card.addEventListener("click", () => {
      toolCards.forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");
    });
  });

  plots.forEach((plot) => {
    plot.addEventListener("click", () => {
      plot.classList.toggle("active");
    });
  });
});