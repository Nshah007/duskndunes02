```javascript
/* =========================================================
   DUSK N DUNES — booking.js

   Enquiry form validation, package auto-fill and
   AJAX submission to forms/enquiry.php
   ========================================================= */

(function () {

  "use strict";

  document.addEventListener("DOMContentLoaded", function () {

    setupPackageAutoFill();
    setupPackageFromQuery();
    setupEnquiryForm();
    setupMinDates();

  });


  /* ---------- Pre-fill "Experience / Activity" from ?package=
     query param (used by tour-packages.html "ENQUIRE NOW" links) ---------- */

  function setupPackageFromQuery() {

    var form = document.querySelector("#enquiryForm");

    if (!form) return;

    var params = new URLSearchParams(window.location.search);
    var pkg = params.get("package");

    if (!pkg) return;

    var field = form.querySelector("#experience");

    if (field) {
      field.value = decodeURIComponent(pkg);
    }

  }


  /* ---------- Package cards fill + scroll to form ---------- */

  function setupPackageAutoFill() {

    document.querySelectorAll("[data-package-select]").forEach(function (btn) {

      btn.addEventListener("click", function (e) {

        var form = document.querySelector("#enquiryForm");

        if (!form) return;

        e.preventDefault();

        var field = form.querySelector("#experience");

        if (field) {
          field.value = btn.getAttribute("data-package-select");
        }

        var target = document.querySelector("#enquiry");

        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }

        var nameField = form.querySelector("#name");

        if (nameField) {
          window.setTimeout(function () {
            nameField.focus();
          }, 500);
        }

      });

    });

  }


  /* ---------- Prevent past-date selection ---------- */

  function setupMinDates() {

    var today = new Date().toISOString().split("T")[0];

    document.querySelectorAll('input[type="date"]').forEach(function (input) {

      input.setAttribute("min", today);

    });

  }


  /* ---------- Validation + AJAX submit ---------- */

  function setupEnquiryForm() {

    var form = document.querySelector("#enquiryForm");

    if (!form) return;

    var msgBox = form.querySelector(".form-msg");

    var submitBtn = form.querySelector('button[type="submit"]');


    form.addEventListener("submit", function (e) {

      e.preventDefault();

      clearErrors(form);
      hideMessage(msgBox);


      /* ---------- Validate form ---------- */

      var errors = validate(form);

      if (Object.keys(errors).length) {

        showErrors(form, errors);

        return;

      }


      /* ---------- Prepare form data ---------- */

      var formData = new FormData(form);

      submitBtn.disabled = true;

      var originalLabel = submitBtn.textContent;

      submitBtn.textContent = "SENDING...";


      /* ---------- Send to PHP ---------- */

      fetch(form.getAttribute("action") || "forms/enquiry.php", {

        method: "POST",

        body: formData,

        headers: {
          "X-Requested-With": "XMLHttpRequest"
        }

      })

        .then(function (res) {

          return res.json().catch(function () {

            return {
              success: false,
              message: "Unexpected server response."
            };

          });

        })


        /* ---------- Handle PHP response ---------- */

        .then(function (data) {

          if (data.success) {

            showMessage(
              msgBox,
              "success",
              "Thank you! Your enquiry has been received. Our reservations team will contact you shortly."
            );

            form.reset();

          } else {

            showMessage(
              msgBox,
              "error",
              data.message ||
              "We could not send your enquiry right now. Please call or WhatsApp us directly."
            );

          }

        })


        /* ---------- Handle connection/server error ---------- */

        .catch(function () {

          showMessage(
            msgBox,
            "error",
            "We could not send your enquiry right now. Please call or WhatsApp us directly."
          );

        })


        /* ---------- Restore button ---------- */

        .finally(function () {

          submitBtn.disabled = false;

          submitBtn.textContent = originalLabel;

        });

    });

  }


  /* ---------- Form validation ---------- */

  function validate(form) {

    var errors = {};

    var name = form.querySelector("#name");
    var mobile = form.querySelector("#mobile");
    var email = form.querySelector("#email");
    var checkin = form.querySelector("#checkin");
    var checkout = form.querySelector("#checkout");


    /* ---------- Name ---------- */

    if (!name.value.trim()) {

      errors.name = "Please enter your name.";

    }


    /* ---------- Mobile ---------- */

    var mobileClean = mobile.value.replace(/[\s-]/g, "");

    if (!mobileClean) {

      errors.mobile = "Please enter your mobile number.";

    } else if (!/^\+?[0-9]{10,13}$/.test(mobileClean)) {

      errors.mobile = "Please enter a valid mobile number.";

    }


    /* ---------- Email ---------- */

    if (
      email.value.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
    ) {

      errors.email = "Please enter a valid email address.";

    }


    /* ---------- Check-in / Check-out ---------- */

    if (checkin.value && checkout.value) {

      if (new Date(checkout.value) <= new Date(checkin.value)) {

        errors.checkout = "Check-out must be after check-in.";

      }

    }


    return errors;

  }


  /* ---------- Show field errors ---------- */

  function showErrors(form, errors) {

    Object.keys(errors).forEach(function (key) {

      var field = form.querySelector("#" + key);

      if (!field) return;

      var errorEl = form.querySelector(
        '[data-error-for="' + key + '"]'
      );

      if (errorEl) {
        errorEl.textContent = errors[key];
      }

      field.setAttribute("aria-invalid", "true");

    });


    var firstKey = Object.keys(errors)[0];

    var firstField = form.querySelector("#" + firstKey);

    if (firstField) {
      firstField.focus();
    }

  }


  /* ---------- Clear field errors ---------- */

  function clearErrors(form) {

    form.querySelectorAll(".field-error").forEach(function (el) {

      el.textContent = "";

    });


    form.querySelectorAll("[aria-invalid]").forEach(function (el) {

      el.removeAttribute("aria-invalid");

    });

  }


  /* ---------- Show success/error message ---------- */

  function showMessage(box, type, text) {

    if (!box) return;

    box.textContent = text;

    box.classList.remove("success", "error");

    box.classList.add("show", type);

    box.setAttribute("role", "status");

    box.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }


  /* ---------- Hide message ---------- */

  function hideMessage(box) {

    if (!box) return;

    box.classList.remove(
      "show",
      "success",
      "error"
    );

    box.textContent = "";

  }


})();
```
