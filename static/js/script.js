document.addEventListener('DOMContentLoaded', function() {
    // Get all campaign cards
    const campaignCards = document.querySelectorAll('.campaign__card');
    const mainReserveBtn = document.getElementById('mainReserveBtn');
    const reservationModal = document.getElementById('reservationModal');
    const summaryModal = document.getElementById('summaryModal');
    const confirmationModal = document.getElementById('confirmationModal');
    const campaignSelect = document.getElementById('campaignSelect');
    const dateInput = document.getElementById('reserveDate');
    const dateAlertModal = document.getElementById('dateAlertModal');
    const reservationForm = document.getElementById('reservationForm');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const visitorModal = document.getElementById('visitorModal');
    const menuBtn = document.getElementById("menu-btn");
    const navLinks = document.getElementById("nav-links");
    const menuBtnIcon = menuBtn?.querySelector("i");
    let isLocked = false;
    let lastReservationData = null;
    let isMenuOpen = false;

    // Mobile menu toggle
    if (menuBtn && navLinks) {
        menuBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            isMenuOpen = !isMenuOpen;
            navLinks.classList.toggle("active");
            
            // Update menu icon
            if (menuBtnIcon) {
                menuBtnIcon.className = isMenuOpen ? "ri-close-line" : "ri-menu-line";
            }
            
            // Prevent body scrolling when menu is open
            document.body.style.overflow = isMenuOpen ? "hidden" : "";
        });

        // Close menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
                isMenuOpen = false;
                if (menuBtnIcon) {
                    menuBtnIcon.className = "ri-menu-line";
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (isMenuOpen && !navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
                isMenuOpen = false;
                if (menuBtnIcon) {
                    menuBtnIcon.className = "ri-menu-line";
                }
            }
        });
    }

    // Character counter for message field
    const messageField = document.getElementById('reserveMessage');
    const charCount = document.getElementById('charCount');
    if (messageField && charCount) {
        // Set maxLength attribute
        messageField.setAttribute('maxLength', '250');
        
        messageField.addEventListener('input', function() {
            const maxLength = 250;
            const remaining = maxLength - this.value.length;
            charCount.textContent = `${this.value.length}/${maxLength}`;
            charCount.style.color = remaining < 50 ? '#D0080E' : '#6c6c6c';
            
            // Truncate text if it exceeds maxLength
            if (this.value.length > maxLength) {
                this.value = this.value.substring(0, maxLength);
            }
        });
        
        // Initialize counter on page load
        charCount.textContent = `0/250`;
    }

    // Phone number validation
    function validatePhoneNumber(phoneNumber) {
        const regex = /^[0-9+()-\s]*$/;
        return regex.test(phoneNumber);
    }

    // Prevent non-numeric input for phone
    function preventNonNumericInput(event) {
        if (!/[0-9+()-\s]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            event.preventDefault();
        }
    }

    // Add event listeners to phone inputs
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('keydown', preventNonNumericInput);
    });

    // Prevent non-numeric input for number of people
    document.getElementById('reservePeople')?.addEventListener('keydown', function(event) {
        if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            event.preventDefault();
        }
    });

    // Name input validation
    function validateNameInput(input) {
        // Remove any numbers from pasted content
        input.value = input.value.replace(/[0-9]/g, '');
        // Remove any invalid characters but allow common punctuation
        input.value = input.value.replace(/[^A-Za-z\s\-',.;:()[\]]/g, '');
    }

    // Add validation to all name input fields
    document.querySelectorAll('input[name="fullName"], input[name="visitorName"]').forEach(input => {
        input.addEventListener('paste', (e) => {
            setTimeout(() => validateNameInput(e.target), 0);
        });
        
        input.addEventListener('input', (e) => {
            validateNameInput(e.target);
        });
    });

    // Function to hide all modals and reset page content
    function hideAllModalsAndContent() {
        // First, hide all modals
        const allModals = [visitorModal, reservationModal, summaryModal, confirmationModal, dateAlertModal];
        allModals.forEach(modal => {
            if (modal) {
                modal.style.display = 'none';
                modal.style.opacity = '0';
                modal.style.visibility = 'hidden';
                modal.classList.remove('show');
            }
        });
        
        // Reset page content visibility
        const mainContent = document.querySelectorAll('body > *:not(#visitorModal):not(script):not(style)');
        mainContent.forEach(element => {
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
        });
        
        document.body.classList.remove('modal-open');
    }

    // Function to show visitor modal only
    function showVisitorModalOnly() {
        hideAllModalsAndContent();
        
        // Hide all content except visitor modal
        const mainContent = document.querySelectorAll('body > *:not(#visitorModal):not(script):not(style)');
        mainContent.forEach(element => {
            if (element !== visitorModal) {
                element.style.opacity = '0.1';
                element.style.pointerEvents = 'none';
            }
        });
        
        // Show visitor modal
        if (visitorModal) {
            visitorModal.style.display = 'block';
            visitorModal.style.opacity = '1';
            visitorModal.style.visibility = 'visible';
            visitorModal.classList.add('show');
            visitorModal.style.zIndex = '10000';
            
            // Prevent closing the visitor modal
            const closeButtons = visitorModal.querySelectorAll('.close-btn, .close');
            closeButtons.forEach(button => {
                button.style.display = 'none';
            });
        }
        
        document.body.classList.add('modal-open');
    }

    // Function to show a specific modal
    function showModal(modal) {
        if (!modal) return;
        hideAllModalsAndContent();
        modal.style.display = 'block';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }

    // Toast notification function
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    }

    // Function to show date alert message
    function showDateAlert(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'date-alert';
        alertDiv.style.cssText = `
            position: absolute;
            top: -60px;
            left: 0;
            right: 0;
            background-color: #fff3cd;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            z-index: 1000;
        `;
        alertDiv.textContent = message;
        
        const dateInputContainer = dateInput.parentElement;
        dateInputContainer.style.position = 'relative';
        dateInputContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // Initialize page state
    const storedVisitorInfo = sessionStorage.getItem('visitorInfo');
    
    // First, ensure all modals are hidden
    hideAllModalsAndContent();
    
    // Then check for visitor info and show appropriate content
    if (!storedVisitorInfo) {
        showVisitorModalOnly();
    } else {
        // Auto-fill visitor info if available
        const visitorInfo = JSON.parse(storedVisitorInfo);
        const reserveName = document.getElementById('reserveName');
        const reservePhone = document.getElementById('reservePhone');
        if (reserveName && reservePhone) {
            reserveName.value = visitorInfo.fullName;
            reservePhone.value = visitorInfo.phoneNumber;
        }
    }

    // Handle visitor form submission
    const visitorForm = document.getElementById('visitorForm');
    if (visitorForm) {
        visitorForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            showLoading(submitButton);
            
            const formData = new FormData(this);
            const visitorData = {
                fullName: formData.get('fullName'),
                phoneNumber: formData.get('phoneNumber')
            };
            
            try {
                const response = await submitVisitorData(visitorData);
                if (response.status === 'success') {
                    sessionStorage.setItem('visitorInfo', JSON.stringify(visitorData));
                    hideAllModalsAndContent();
                    showToast('Welcome to PALUTO!');
                } else {
                    throw new Error(response.message || 'Failed to submit visitor information');
                }
            } catch (error) {
                console.error('Error submitting visitor data:', error);
                showToast('Error: ' + error.message);
            } finally {
                hideLoading(submitButton);
            }
        });
    }

    // Main reserve button click handler
    if (mainReserveBtn) {
        mainReserveBtn.addEventListener('click', function() {
            if (!sessionStorage.getItem('visitorInfo')) {
                showVisitorModalOnly();
                return;
            }

            // Reset campaign selection
            if (campaignSelect) {
                campaignSelect.disabled = false;
                campaignSelect.classList.remove('locked-field');
                campaignSelect.value = 'Basic';
            }

            // Show reservation modal
            if (reservationForm) {
                reservationForm.reset();
            }

            showModal(reservationModal);

            // Set default date to tomorrow
            if (dateInput) {
                const tomorrow = getTomorrowDate();
                dateInput.value = tomorrow;
                dateInput.min = tomorrow;
            }

            // Auto-fill visitor info
            const storedInfo = sessionStorage.getItem('visitorInfo');
            if (storedInfo) {
                const visitorInfo = JSON.parse(storedInfo);
                const reserveName = document.getElementById('reserveName');
                const reservePhone = document.getElementById('reservePhone');
                if (reserveName && reservePhone) {
                    reserveName.value = visitorInfo.fullName;
                    reservePhone.value = visitorInfo.phoneNumber;
                }
            }
        });
    }

    // Function to save reservation form data
    function saveReservationData() {
        if (reservationForm) {
            const formData = new FormData(reservationForm);
            lastReservationData = {
                fullName: formData.get('fullName'),
                phoneNumber: formData.get('phoneNumber'),
                inquiryType: formData.get('inquiryType'),
                numberOfPeople: formData.get('numberOfPeople'),
                message: formData.get('message')
            };
            sessionStorage.setItem('lastReservationData', JSON.stringify(lastReservationData));
        }
    }

    // Function to load reservation data
    function loadReservationData() {
        const storedReservationData = sessionStorage.getItem('lastReservationData');
        if (storedReservationData && reservationForm) {
            const data = JSON.parse(storedReservationData);
            const reserveName = document.getElementById('reserveName');
            const reservePhone = document.getElementById('reservePhone');
            const inquiryType = document.getElementById('inquiryType');
            const reservePeople = document.getElementById('reservePeople');
            const reserveMessage = document.getElementById('reserveMessage');

            if (reserveName) reserveName.value = data.fullName || '';
            if (reservePhone) reservePhone.value = data.phoneNumber || '';
            if (inquiryType) inquiryType.value = data.inquiryType || '';
            if (reservePeople) reservePeople.value = data.numberOfPeople || '';
            if (reserveMessage) reserveMessage.value = data.message || '';
        }
    }

    // Add event listener to reservation form for saving data
    if (reservationForm) {
        reservationForm.addEventListener('input', saveReservationData);
    }

    // Date handling functions
    function getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    function getNextFriday() {
        const today = new Date();
        const friday = new Date();
        friday.setDate(today.getDate() + ((5 + 7 - today.getDay()) % 7));
        if (friday <= today) {
            friday.setDate(friday.getDate() + 7);
        }
        return friday;
    }

    // Function to format date for display
    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Function to submit visitor data to Google Sheets
    async function submitVisitorData(visitorData) {
        try {
            const response = await fetch('/submit_visitor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(visitorData)
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error submitting visitor data:', error);
            return { status: 'error', message: error.message };
        }
    }

    // Function to submit reservation data to Google Sheets
    async function submitReservation(reservationData) {
        showLoading();
        try {
            const response = await fetch('/submit_reservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservationData)
            });
            const result = await response.json();
            hideLoading();
            return result;
        } catch (error) {
            hideLoading();
            console.error('Error submitting reservation:', error);
            return { status: 'error', message: error.message };
        }
    }

    // Update reservation form submission
    if (reservationForm) {
        reservationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            showLoading(submitButton);
            
            try {
                const formData = new FormData(this);
                const reservationData = {
                    fullName: formData.get('fullName'),
                    phoneNumber: formData.get('phoneNumber'),
                    inquiryType: formData.get('inquiryType'),
                    date: formData.get('date'),
                    time: formData.get('time'),
                    numberOfPeople: formData.get('numberOfPeople'),
                    message: formData.get('message'),
                    campaign: formData.get('campaign')
                };

                saveReservationData();

                if (summaryModal) {
                    const summaryContent = document.getElementById('summaryContent');
                    if (summaryContent) {
                        summaryContent.innerHTML = `
                            <p><strong>Campaign:</strong> ${reservationData.campaign}</p>
                            <p><strong>Full Name:</strong> ${reservationData.fullName}</p>
                            <p><strong>Contact Number:</strong> ${reservationData.phoneNumber}</p>
                            <p><strong>Type of Inquiry:</strong> ${reservationData.inquiryType}</p>
                            <p><strong>Date:</strong> ${formatDate(reservationData.date)}</p>
                            <p><strong>Time:</strong> ${reservationData.time}</p>
                            <p><strong>Number of People:</strong> ${reservationData.numberOfPeople}</p>
                            ${reservationData.message ? `<p><strong>Special Requests:</strong> ${reservationData.message}</p>` : ''}
                        `;
                    }

                    // Store the reservation data for later use
                    const confirmButton = document.getElementById('confirmReservation');
                    if (confirmButton) {
                        confirmButton.dataset.reservationData = JSON.stringify(reservationData);
                    }

                    showModal(summaryModal);
                }

                // Handle confirm reservation button
                const confirmButton = document.getElementById('confirmReservation');
                if (confirmButton) {
                    confirmButton.onclick = async function() {
                        showLoading(confirmButton);
                        try {
                            const savedData = JSON.parse(this.dataset.reservationData);
                            const result = await submitReservation(savedData);
                            
                            if (result.status === 'error') {
                                showToast('Error submitting reservation: ' + result.message);
                                return;
                            }

                            hideAllModalsAndContent();
                            
                            const confirmationCode = document.getElementById('reservationCode');
                            if (confirmationCode) {
                                confirmationCode.innerHTML = `
                                    <div class="code-display">
                                        <span class="code">${result.reservationCode || 'PALUTO-' + Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                                    </div>
                                `;
                            }

                            if (confirmationModal) {
                                showModal(confirmationModal);
                            }
                        } catch (error) {
                            console.error('Reservation error:', error);
                            showToast('Failed to submit reservation. Please try again.');
                        } finally {
                            hideLoading(confirmButton);
                        }
                    };
                }
            } finally {
                hideLoading(submitButton);
            }
        });
    }

    // Handle done button in confirmation modal
    const doneButton = document.getElementById('doneButton');
    if (doneButton) {
        doneButton.addEventListener('click', function() {
            confirmationModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            // Clear the reservation form
            if (reservationForm) {
                reservationForm.reset();
            }
            // Reset the page state without redirecting
            hideAllModalsAndContent();
        });
    }

    // Close modal when clicking the close button or outside the modal
    const closeButtons = document.querySelectorAll('.close-btn, .close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal && modal !== visitorModal) {
                hideAllModalsAndContent();
            }
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal') && event.target !== visitorModal) {
            hideAllModalsAndContent();
        }
    });

    // Function to lock campaign selection
    function lockCampaign() {
        campaignSelect.classList.add('locked');
        campaignSelect.parentElement.classList.add('locked-campaign');
        campaignSelect.disabled = true;
        isLocked = true;
    }

    // Function to unlock campaign selection
    function unlockCampaign() {
        campaignSelect.classList.remove('locked');
        campaignSelect.parentElement.classList.remove('locked-campaign');
        campaignSelect.disabled = false;
        isLocked = false;
    }

    // Modify the part where reservation modal is shown to load saved data
    campaignCards.forEach(card => {
        card.addEventListener('click', function() {
            const campaign = this.dataset.campaign;
            
            if (campaignSelect) {
                campaignSelect.value = campaign;
                campaignSelect.dispatchEvent(new Event('change'));
                lockCampaign();
            }
            
            if (reservationModal) {
                reservationModal.style.display = 'block';
                document.body.classList.add('modal-open');

                // Auto-fill visitor info and saved reservation data
                const storedInfo = sessionStorage.getItem('visitorInfo');
                if (storedInfo) {
                    const visitorInfo = JSON.parse(storedInfo);
                    const reserveName = document.getElementById('reserveName');
                    const reservePhone = document.getElementById('reservePhone');
                    if (reserveName && reservePhone) {
                        reserveName.value = visitorInfo.fullName;
                        reservePhone.value = visitorInfo.phoneNumber;
                    }
                }
                loadReservationData();
            }

            // Remove specific code for Campaign 1 date setting
            if (!dateInput.value) {
                dateInput.value = getTomorrowDate();
            }
        });
    });

    // Update campaign select change handler
    if (campaignSelect) {
        campaignSelect.addEventListener('change', function() {
            const tomorrow = getTomorrowDate();
            dateInput.value = tomorrow;
            dateInput.min = tomorrow;
        });
    }

    // Date input change handler
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            // Allow any date to be selected
        });
    }

    // Enhanced loading functions
    function showLoading(button = null) {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.zIndex = '10000';
            document.body.classList.add('loading');
        }
        if (button) {
            button.classList.add('loading');
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Processing...';
        }
    }

    function hideLoading(button = null) {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            document.body.classList.remove('loading');
        }
        if (button) {
            button.classList.remove('loading');
            button.disabled = false;
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
        }
    }

    // Add touch event handlers for campaign cards
    campaignCards.forEach(card => {
        let touchTimeout;
        let isTouchActive = false;
        let hasScrolled = false;
        let startY = 0;
        let isHolding = false;

        // Touch start event
        card.addEventListener('touchstart', function(e) {
            startY = e.touches[0].clientY;
            touchTimeout = setTimeout(() => {
                isTouchActive = true;
                isHolding = true;
                this.classList.add('touch-active');
            }, 100); // 0.1 seconds delay
        });

        // Touch move event
        card.addEventListener('touchmove', function(e) {
            const currentY = e.touches[0].clientY;
            const deltaY = Math.abs(currentY - startY);
            
            // If user has moved more than 10 pixels vertically, consider it a scroll
            if (deltaY > 10) {
                hasScrolled = true;
            }
            
            // Keep the image visible if user is still holding
            if (isHolding) {
                this.classList.add('touch-active');
            }
        });

        // Touch end event
        card.addEventListener('touchend', function(e) {
            clearTimeout(touchTimeout);
            isHolding = false;
            
            if (!hasScrolled) {
                // Only navigate if it was a quick tap and no scrolling occurred
                window.location.href = this.href;
            }
            
            isTouchActive = false;
            hasScrolled = false;
            this.classList.remove('touch-active');
        });

        // Touch cancel event
        card.addEventListener('touchcancel', function(e) {
            clearTimeout(touchTimeout);
            isHolding = false;
            isTouchActive = false;
            hasScrolled = false;
            this.classList.remove('touch-active');
        });
    });

    /*=============== ROTATING CONTACT WIDGET ===============*/
    const toggleBtn = document.getElementById('toggle-btn');
    const contactContainer = document.querySelector('.contact-container');
    const iconBtns = document.querySelectorAll('.icon-btn');
    let hasBeenActivated = false;

    // Function to show the contact widget
    function showContactWidget() {
        if (!contactContainer.classList.contains('active')) {
            contactContainer.classList.add('active');
            toggleBtn.classList.add('active');
            toggleBtn.classList.add('has-been-activated');
            const icon = toggleBtn.querySelector('i');
            icon.className = 'ri-close-line';
            hasBeenActivated = true;
        }
    }

    // Function to hide the contact widget
    function hideContactWidget() {
        contactContainer.classList.remove('active');
        toggleBtn.classList.remove('active');
        const icon = toggleBtn.querySelector('i');
        icon.className = 'ri-contacts-fill';
    }

    // Touch event handling for mobile
    let touchTimer;
    let isTouching = false;

    toggleBtn.addEventListener('touchstart', (e) => {
        if (hasBeenActivated) {
            handleToggleClick();
            return;
        }
        
        isTouching = true;
        touchTimer = setTimeout(() => {
            if (isTouching && !hasBeenActivated) {
                toggleBtn.classList.add('touch-active');
            }
        }, 100);
    });

    toggleBtn.addEventListener('touchend', (e) => {
        isTouching = false;
        clearTimeout(touchTimer);
        
        if (!toggleBtn.classList.contains('touch-active')) {
            handleToggleClick();
        }
        
        setTimeout(() => {
            toggleBtn.classList.remove('touch-active');
        }, 100);
    });

    toggleBtn.addEventListener('touchmove', (e) => {
        isTouching = false;
        clearTimeout(touchTimer);
        toggleBtn.classList.remove('touch-active');
    });

    // Click handler for desktop
    toggleBtn.addEventListener('click', handleToggleClick);

    // Handle navigation "Contact Us" links
    document.querySelectorAll('a[href="#contact"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    function handleToggleClick() {
        if (contactContainer.classList.contains('active')) {
            hideContactWidget();
        } else {
            showContactWidget();
        }
    }

    /* =============== MENU FUNCTIONALITY =============== */
    const menuFilters = document.querySelectorAll('.menu__filter');
    const menuCategories = document.querySelectorAll('.menu__category');

    function switchMenuCategory(e) {
        const targetCategory = e.target.getAttribute('data-category');
        
        // Update active filter
        menuFilters.forEach(filter => {
            filter.classList.remove('active');
        });
        e.target.classList.add('active');

        // Show selected category with fade effect
        menuCategories.forEach(category => {
            if (category.getAttribute('data-category') === targetCategory) {
                category.classList.add('active');
                // Reset opacity and transform for items in active category
                const items = category.querySelectorAll('.menu__item');
                items.forEach(item => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 100);
                });
            } else {
                category.classList.remove('active');
            }
        });
    }

    // Add click event listeners to filters
    menuFilters.forEach(filter => {
        filter.addEventListener('click', switchMenuCategory);
    });

    // Initialize Intersection Observer for menu items animation
    const menuItems = document.querySelectorAll('.menu__item');
    const menuObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                menuObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    // Set initial state and observe menu items
    menuItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        menuObserver.observe(item);
    });

    /* =============== GALLERY FUNCTIONALITY =============== */
    const galleryGrid = document.querySelector('.gallery__grid');
    const galleryFilters = document.querySelectorAll('.gallery__filter');
    const galleryItems = document.querySelectorAll('.gallery__item');
    const lightbox = document.querySelector('.gallery__lightbox');
    const lightboxImage = document.querySelector('.lightbox__image');
    const lightboxCaption = document.querySelector('.lightbox__caption');
    const lightboxClose = document.querySelector('.lightbox__close');
    const lightboxPrev = document.querySelector('.lightbox__prev');
    const lightboxNext = document.querySelector('.lightbox__next');
    let currentImageIndex = 0;
    let filteredItems = [...galleryItems];

    // Filter gallery items
    galleryFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Remove active class from all filters
            galleryFilters.forEach(f => f.classList.remove('active'));
            // Add active class to clicked filter
            filter.classList.add('active');
            
            const category = filter.getAttribute('data-filter');
            
            // Filter items
            galleryItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                if (category === 'all' || category === itemCategory) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });

            // Update filtered items array
            filteredItems = [...galleryItems].filter(item => 
                !item.classList.contains('hidden')
            );
        });
    });

    // Open lightbox
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const title = item.querySelector('h3').textContent;
            const description = item.querySelector('p').textContent;
            
            lightboxImage.src = img.src;
            lightboxImage.alt = img.alt;
            lightboxCaption.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
            lightbox.classList.add('active');
            currentImageIndex = filteredItems.indexOf(item);
            
            // Disable body scroll
            document.body.style.overflow = 'hidden';
        });
    });

    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Navigate through images
    function showImage(index) {
        if (index >= 0 && index < filteredItems.length) {
            const item = filteredItems[index];
            const img = item.querySelector('img');
            const title = item.querySelector('h3').textContent;
            const description = item.querySelector('p').textContent;
            
            lightboxImage.src = img.src;
            lightboxImage.alt = img.alt;
            lightboxCaption.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
            currentImageIndex = index;
        }
    }

    lightboxPrev.addEventListener('click', () => {
        let newIndex = currentImageIndex - 1;
        if (newIndex < 0) newIndex = filteredItems.length - 1;
        showImage(newIndex);
    });

    lightboxNext.addEventListener('click', () => {
        let newIndex = currentImageIndex + 1;
        if (newIndex >= filteredItems.length) newIndex = 0;
        showImage(newIndex);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                lightboxPrev.click();
                break;
            case 'ArrowRight':
                lightboxNext.click();
                break;
            case 'Escape':
                closeLightbox();
                break;
        }
    });

    // Touch swipe functionality for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeLength = touchEndX - touchStartX;
        
        if (Math.abs(swipeLength) > swipeThreshold) {
            if (swipeLength > 0) {
                lightboxPrev.click();
            } else {
                lightboxNext.click();
            }
        }
    }

    /* =============== FAQ ACCORDION =============== */
    const faqGrid = document.querySelector('.faq__grid');
    const faqs = [
        {
            question: "What are your operating hours?",
            answer: "We are open daily from 11:00 AM to 9:00 PM."
        },
        {
            question: "Do you accept reservations?",
            answer: "Yes, we accept reservations through our online booking system or by phone."
        },
        // Add more FAQs...
    ];

    // Populate FAQ grid
    faqGrid.innerHTML = faqs.map(faq => `
        <div class="faq__item">
            <button class="faq__question">
                ${faq.question}
                <i class="ri-arrow-down-s-line"></i>
            </button>
            <div class="faq__answer">
                <p>${faq.answer}</p>
            </div>
        </div>
    `).join('');

    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq__item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq__question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            // Close all FAQ items
            faqItems.forEach(i => i.classList.remove('active'));
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    /* =============== CONTACT FORM =============== */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            showLoading(submitButton);

            try {
                const formData = new FormData(this);
                const response = await fetch('/submit_contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(Object.fromEntries(formData))
                });

                const result = await response.json();
                if (result.status === 'success') {
                    showToast('Message sent successfully!');
                    this.reset();
                } else {
                    throw new Error(result.message || 'Failed to send message');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                showToast('Error: ' + error.message);
            } finally {
                hideLoading(submitButton);
            }
        });
    }

    /* =============== GOOGLE MAPS =============== */
    // Initialize Google Maps
    function initMap() {
        const mapContainer = document.querySelector('.contact__map');
        if (mapContainer) {
            // Replace with your restaurant's coordinates
            const location = { lat: 10.7202, lng: 122.5621 }; // Iloilo City coordinates
            const map = new google.maps.Map(mapContainer, {
                zoom: 15,
                center: location,
                styles: [
                    // Add custom map styles here
                ]
            });

            const marker = new google.maps.Marker({
                position: location,
                map: map,
                title: 'PALUTO Seafood Grill & Restaurant'
            });
        }
    }

    // Load Google Maps API
    if (document.querySelector('.contact__map')) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    // Menu Price Lightbox functionality
    const menuPriceItems = document.querySelectorAll('.menu__category[data-category="prices"] .menu__item');
    
    // Create lightbox elements
    const menuPriceLightbox = document.createElement('div');
    menuPriceLightbox.className = 'menu__price-lightbox';
    const lightboxImg = document.createElement('img');
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    menuPriceLightbox.appendChild(lightboxImg);
    menuPriceLightbox.appendChild(closeBtn);
    document.body.appendChild(menuPriceLightbox);

    // Add click handlers for menu price items
    menuPriceItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            menuPriceLightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Close lightbox on button click
    closeBtn.addEventListener('click', () => {
        menuPriceLightbox.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close lightbox on outside click
    menuPriceLightbox.addEventListener('click', (e) => {
        if (e.target === menuPriceLightbox) {
            menuPriceLightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close lightbox on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuPriceLightbox.classList.contains('active')) {
            menuPriceLightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Function to fetch and display reviews
    async function loadReviews() {
        const reviewsGrid = document.getElementById('reviewsGrid');
        if (!reviewsGrid) return;

        try {
            const response = await fetch('/api/reviews');
            const data = await response.json();

            if (data.success && data.reviews.length > 0) {
                // Remove loading state
                reviewsGrid.innerHTML = '';

                // Display reviews
                data.reviews.forEach(review => {
                    const reviewCard = document.createElement('div');
                    reviewCard.className = 'review__card';
                    
                    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    
                    reviewCard.innerHTML = `
                        <div class="review__header">
                            <img src="${review.avatar}" alt="${review.name}" class="review__avatar" onerror="this.src='{{ url_for('static', filename='images/default-avatar.png') }}'">
                            <div class="review__info">
                                <div class="review__name">${review.name}</div>
                                <div class="review__date">
                                    ${review.date}
                                    ${review.relative_time ? `<span class="review__relative-time">(${review.relative_time})</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="review__rating">${stars}</div>
                        <div class="review__text">${review.text}</div>
                    `;
                    
                    reviewsGrid.appendChild(reviewCard);
                });
            } else {
                reviewsGrid.innerHTML = '<p>No reviews available at the moment.</p>';
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            reviewsGrid.innerHTML = '<p>Error loading reviews. Please try again later.</p>';
        }
    }

    // Load reviews when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        loadReviews();
        // ... existing code ...
    });

    // Prevent body scroll when modal is open
    function toggleBodyScroll(disable) {
        document.body.style.overflow = disable ? 'hidden' : '';
    }

    // Close modal function
    function closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            toggleBodyScroll(false);
        }
    }

    // Initialize all close buttons
    document.addEventListener('DOMContentLoaded', function() {
        const closeButtons = document.querySelectorAll('.close-btn, .close');
        closeButtons.forEach(button => {
            const modal = button.closest('.modal');
            if (modal) {
                button.addEventListener('click', () => closeModal(modal));
            }
        });
    });
}); 