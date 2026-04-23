"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const title = document.querySelector(".title");

  if (!title) return;

  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long" });
  const day = now.getDate();
  const monthIndex = now.getMonth();
  const date = now.getDate();

  let season = "";

  if (
    (monthIndex === 2 && date >= 20) ||
    monthIndex === 3 ||
    monthIndex === 4 ||
    (monthIndex === 5 && date <= 20)
  ) {
    season = "Spring";
  } else if (
    (monthIndex === 5 && date >= 21) ||
    monthIndex === 6 ||
    monthIndex === 7 ||
    (monthIndex === 8 && date <= 21)
  ) {
    season = "Summer";
  } else if (
    (monthIndex === 8 && date >= 22) ||
    monthIndex === 9 ||
    monthIndex === 10 ||
    (monthIndex === 11 && date <= 20)
  ) {
    season = "Fall";
  } else {
    season = "Winter";
  }

  title.textContent = `${season} ${month} ${day}`;
});
