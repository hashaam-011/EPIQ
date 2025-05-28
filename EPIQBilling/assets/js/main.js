/**
* Template Name: QuickStart
* Template URL: https://bootstrapmade.com/quickstart-bootstrap-startup-website-template/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

// Terms and Conditions Popup Functions
function showTermsPopup() {
  const popup = document.getElementById('termsPopup');
  if (popup) {
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeTermsPopup() {
  const popup = document.getElementById('termsPopup');
  if (popup) {
    popup.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function acceptTerms() {
  localStorage.setItem('termsAccepted', 'true');
  closeTermsPopup();
}

function declineTerms() {
  localStorage.setItem('termsAccepted', 'false');
  closeTermsPopup();
  window.location.href = 'decline.html';
}

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Frequently Asked Questions Toggle
   */
  document.querySelectorAll('.faq-item h3, .faq-item .faq-toggle').forEach((faqItem) => {
    faqItem.addEventListener('click', () => {
      faqItem.parentNode.classList.toggle('faq-active');
    });
  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

  // Check if terms were accepted when page loads
  document.addEventListener('DOMContentLoaded', function() {
    const termsAccepted = localStorage.getItem('termsAccepted');
    if (!termsAccepted) {
      showTermsPopup();
    }
  });

  // Function to add a note to a form
  async function addNote(formId, note) {
    try {
      const response = await fetch(`/api/form/${formId}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note,
          user_id: currentUser.id,
          user_role: currentUser.role
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Note added successfully', 'success');
        // Refresh the form view to show the new note
        loadFormDetails(formId);
      } else {
        showNotification(data.message || 'Error adding note', 'error');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      showNotification('Error adding note', 'error');
    }
  }

  // Function to load form details including notes
  async function loadFormDetails(formId) {
    try {
      const response = await fetch(`/api/form/${formId}`);
      const data = await response.json();

      if (data.success) {
        const form = data.form;
        const formContainer = document.getElementById('formContainer');

        // Create form view
        let formHtml = `
          <div class="form-view">
            <h2>${form.form_type} Form</h2>
            <div class="form-details">
              ${Object.entries(JSON.parse(form.form_data)).map(([key, value], index) => `
                <div class="form-field">
                  <div class="field-actions">
                    <button class="add-note-btn" onclick="showNoteModal('${key}')">Add Note</button>
                  </div>
                  <label>${key}:</label>
                  <div class="form-value">${value}</div>
                </div>
              `).join('')}
            </div>

            <div class="notes-section">
              <h3>All Notes</h3>
              <div class="notes-list">
                ${form.notes ? form.notes.split('\n').map(note => `
                  <div class="note">${note}</div>
                `).join('') : '<p>No notes yet</p>'}
              </div>
            </div>
          </div>
        `;

        formContainer.innerHTML = formHtml;
      } else {
        showNotification(data.message || 'Error loading form', 'error');
      }
    } catch (error) {
      console.error('Error loading form details:', error);
      showNotification('Error loading form details', 'error');
    }
  }

  // Function to submit a form
  async function submitForm(formType, formData, status = 'final') {
    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          form_type: formType,
          form_data: formData,
          status: status
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Form submitted successfully', 'success');
        if (status === 'final') {
          // Redirect to form view page
          window.location.href = `/form-view.html?id=${data.submission.id}`;
        }
      } else {
        showNotification(data.message || 'Error submitting form', 'error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification('Error submitting form', 'error');
    }
  }

})();