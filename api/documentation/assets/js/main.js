(function () {
  "use strict";

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      var expanded = nav.classList.contains("is-open");
      toggle.setAttribute("aria-expanded", expanded);
    });
  }

  var currentPage = document.body.getAttribute("data-page");
  if (currentPage) {
    var subnavLinks = document.querySelectorAll(".module-subnav a");
    subnavLinks.forEach(function (link) {
      if (link.getAttribute("data-page") === currentPage) {
        link.classList.add("is-active");
      }
    });
  }

  var siteSection = document.body.getAttribute("data-site-section");
  if (siteSection) {
    var siteLinks = document.querySelectorAll(".site-nav a");
    siteLinks.forEach(function (link) {
      if (link.getAttribute("data-section") === siteSection) {
        link.classList.add("is-active");
      }
    });
  }
})();
