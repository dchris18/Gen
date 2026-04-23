"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const eyeButton = document.querySelector(".eye-button");
  const toolButtons = document.querySelectorAll(".tool-btn");

  eyeButton?.addEventListener("click", () => {
    alert("Preview mode");
  });

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toolButtons.forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
    });
  });
});