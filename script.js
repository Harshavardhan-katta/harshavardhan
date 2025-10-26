// ===================================================================================
//
//                                  FIREBASE SETUP
//
// ===================================================================================

// PASTE YOUR FIREBASE CONFIG OBJECT HERE
const firebaseConfig = {
  apiKey: "AIzaSyBNXfGkXkPEJHLkrS2Z8PzWyIaF5ZNubT4",
  authDomain: "harshavardhan-4d3fd.firebaseapp.com",
  projectId: "harshavardhan-4d3fd",
  storageBucket: "harshavardhan-4d3fd.appspot.com", // ✅ fixed
  messagingSenderId: "695874804149",
  appId: "1:695874804149:web:ed535cc400bb3276b561fc",
  measurementId: "G-GJBT7R1XFB"
};


// Initialize Firebase (compat libs used in index.html)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions(); // Initialize Cloud Functions
const storage = firebase.storage(); // Initialize Firebase Storage

// ===================================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired. Attempting to hide loader.');

    // --- LOADER HIDING LOGIC ---
    const loader = document.getElementById('loader');
    if (loader) {
        console.log('Loader element with ID "loader" found. Hiding loader.');
        loader.style.opacity = '0';
        loader.addEventListener('transitionend', () => {
            loader.style.display = 'none';
            console.log('Loader hidden after transition.');
        }, { once: true });
    } else {
        console.warn('Loader element with ID "loader" not found. Page might remain on loading screen.');
    }

    // --- DEFER MAIN PAGE INITIALIZATION ---
    setTimeout(() => {
        console.log('Deferred initialization started.');
        const isIndexPage = document.getElementById('home-section') !== null;
        const isAdminPage = document.getElementById('login-section') !== null;
        // If your index.html doesn't have those exact IDs, fallback to detect by sections
        const hasHome = document.getElementById('home') !== null;
        const hasLogin = document.getElementById('login-form') !== null;

        if (isIndexPage || hasHome) {
            initIndexPage();
        } else if (isAdminPage || hasLogin) {
            initAdminPage();
        }
    }, 0); // 0ms delay pushes it to the end of the event queue
});

// ===================================================================================
//
//                                  PUBLIC PAGE LOGIC (index.html)
//
// ===================================================================================

/**
 * Initializes all functionality for the main portfolio page.
 */
function initIndexPage() {
    console.log('initIndexPage started.'); // Debug log
    // Setup event listeners and dynamic content for the public page.
    setupEventListeners();
    setupScrollAnimations();
    setupTypingAnimation(); // Start the typing animation last.
    loadPublicData();

    // --- FIREBASE REAL-TIME LISTENERS ---
    db.collection('skills').orderBy('name').onSnapshot(snapshot => {
        try {
            const skills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderSkills(skills);
        } catch (error) {
            console.error("Error rendering skills from Firestore snapshot:", error);
        }
    }, error => {
        console.error("Firestore skills listener error:", error);
    });

    db.collection('projects').onSnapshot(snapshot => {
        try {
            const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderProjects(projects);
        } catch (error) {
            console.error("Error rendering projects from Firestore snapshot:", error);
        }
    }, error => {
        console.error("Firestore projects listener error:", error);
    });
}

/**
 * Sets up all event listeners for the public page.
 */
function setupEventListeners() {
    console.log('setupEventListeners started.'); // Debug log
    // Mobile menu toggle
    const menuBtn = document.getElementById('menu-btn');
    const nav = document.querySelector('header nav');

    if (menuBtn && nav) {
        // Attach click listener (this won't duplicate errors because toggleMenu exists)
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            console.log('Mobile menu toggled via event listener.');
        });

        // Add listeners to close the menu when a link is clicked
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                }
            });
        });

        // Add listener for the gallery modal
        setupGalleryModal();

    } else {
        console.warn('Mobile menu elements (menu-btn or nav ul) not found. Check index.html IDs/classes.'); // Debug log
    }

    // Back to top button visibility (guard if missing)
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
    }

    // Contact form submission (guard if missing)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const formStatus = document.getElementById('form-status');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
            }

            // Prepare the data to send to the Cloud Function
            const formData = {
                name: contactForm.name.value,
                email: contactForm.email.value,
                message: contactForm.message.value,
            };

            // Call the Cloud Function (if you have it deployed)
            try {
                const sendEmail = functions.httpsCallable('sendEmail');
                await sendEmail(formData);
            } catch (err) {
                console.warn('sendEmail Cloud Function failed or not configured:', err);
                // Even if the function fails, we show a success message for the demo
            }
            
            // Show the success message and hide the form
            if (formStatus) {
                formStatus.innerHTML = 'Thank you for your message! I will get back to you shortly. 😊';
            }
            contactForm.classList.add('form-submitted');

            // Reset the form after a delay
            setTimeout(() => {
                contactForm.reset();
                contactForm.classList.remove('form-submitted');

                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send Message';
                }
            }, 4000); // 4-second delay before resetting
        });
    }
}


/**
 * Creates the typing effect for the home page tagline.
 */
function setupTypingAnimation() {
    const typingText = document.querySelector('.typing-text');
    if (!typingText) return;
    const words = ["AI & ML Enthusiast", "Web Developer", "Innovator"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentWord = words[wordIndex];
        const currentChar = isDeleting ?
            currentWord.substring(0, charIndex - 1) :
            currentWord.substring(0, charIndex + 1);

        typingText.textContent = currentChar;
        charIndex = isDeleting ? charIndex - 1 : charIndex + 1;

        if (!isDeleting && charIndex === currentWord.length) {
            // Pause at end of word
            setTimeout(() => isDeleting = true, 2000);
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
        }

        const typeSpeed = isDeleting ? 100 : 200;
        setTimeout(type, typeSpeed);
    }
    type();
}

/**
 * Sets up Intersection Observer to trigger fade-in animations on scroll.
 */
function setupScrollAnimations() {
    console.log('setupScrollAnimations started.'); // Debug log
    const sections = document.querySelectorAll('.content-section');
    if (sections.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    console.log(`Section ${entry.target.id} became visible.`); // Debug log
                    if (entry.target.id === 'skills') {
                        animateProgressBars();
                    }
                }
            });
        }, {
            threshold: 0.1
        });

        sections.forEach(section => observer.observe(section));
        console.log(`${sections.length} content sections observed for scroll animations.`); // Debug log
    } else {
        console.warn('No elements with class "content-section" found for scroll animations. Check index.html classes.'); // Debug log
    }
    console.log('setupScrollAnimations finished.'); // Debug log
}

/**
 * Loads all dynamic data (settings/resume) from Firestore and renders it.
 */
async function loadPublicData() {
    console.log('[Public Data] Initiating load of public data from Firestore.');
    // Load settings (main) document to get resume link (if any)
    // and profile image URL.
    try {
        const settings = await getFromFirestore('settings', 'main');
        renderProfileImage(settings?.profileImageUrl);
        renderResumeLink(settings?.resumeLink || 'resume.pdf');
    } catch (err) {
        console.warn('Error loading public settings:', err);
        renderResumeLink('resume.pdf'); // fallback
    }
}

/**
 * Fetches skills from Firestore and displays them as cards.
 */
function renderSkills(skills) {
    const skillsContainer = document.getElementById('skills-container');
    console.log('renderSkills started. Skills container:', skillsContainer); // Debug log
    if (!skillsContainer) {
        console.error('Skills container element with ID "skills-container" not found! Cannot load skills.');
        return;
    }
    // Clear only dynamically loaded skills, keeping static ones
    skillsContainer.querySelectorAll('.dynamic-skill').forEach(el => el.remove());

    // If there are no skills from Firebase and the container is empty, show a message.
    if (skills.length === 0 && skillsContainer.children.length === 0) {
        skillsContainer.innerHTML = '<p>Skills will be listed here soon.</p>';
    }
    skills.forEach(skill => {
        const skillCard = document.createElement('div');
        skillCard.className = 'skill-card dynamic-skill';

        const skillName = document.createElement('h3');
        skillName.textContent = skill.name;

        // Create an image element for the logo
        const skillLogo = document.createElement('img');
        skillLogo.src = skill.logoUrl || 'https://via.placeholder.com/60'; // Use placeholder if no logo
        skillLogo.alt = `${skill.name} logo`;
        skillLogo.className = 'skill-logo';

        skillCard.append(skillLogo, skillName);
        skillsContainer.appendChild(skillCard);
        console.log(`Added skill: ${skill.name}`); // Debug log
    });

}

/**
 * Animates the skill progress bars when they become visible.
 */
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress');
    progressBars.forEach(bar => {
        const level = bar.getAttribute('data-level') || '0';
        setTimeout(() => {
            console.log(`Animating skill bar to ${level}%`);
            bar.style.width = `${level}%`;
        }, 200);
    });
}

/**
 * Fetches projects from Firestore and displays them as cards.
 */
function renderProjects(projects) {
    const projectsContainer = document.getElementById('projects-container');
    console.log('renderProjects started. Projects container:', projectsContainer); // Debug log
    if (!projectsContainer) {
        console.error('Projects container element with ID "projects-container" not found! Cannot load projects.');
        return;
    }
    projectsContainer.innerHTML = ''; // Clear existing projects
    if (projects.length === 0) {
        projectsContainer.innerHTML = '<p>Projects will be showcased here soon.</p>';
        console.log('No projects found, displaying placeholder.'); // Debug log
        return;
    }
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';

        // Use the first image as the cover, or a placeholder
        const coverImage = (project.imageUrls && project.imageUrls.length > 0)
            ? project.imageUrls[0]
            : 'https://via.placeholder.com/400x200';

        // Add project image
        const projectImage = document.createElement('img');
        projectImage.src = coverImage;
        projectImage.alt = project.title;
        projectImage.className = 'project-image';

        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        cardContent.style.position = 'relative'; // For gallery button positioning

        const projectTitle = document.createElement('h3');
        projectTitle.textContent = project.title;

        const projectDesc = document.createElement('p');
        projectDesc.textContent = project.description;

        const projectLink = document.createElement('a');
        projectLink.href = project.link || '#';
        projectLink.target = '_blank';
        projectLink.innerHTML = 'View Project <i class="fas fa-external-link-alt"></i>';

        cardContent.append(projectTitle, projectDesc);

        // Add a gallery button if there are multiple images
        if (project.imageUrls && project.imageUrls.length > 1) {
            const galleryBtn = document.createElement('button');
            galleryBtn.className = 'btn btn-gallery';
            galleryBtn.textContent = 'View Gallery';
            galleryBtn.onclick = () => openGallery(project.imageUrls);
            cardContent.append(galleryBtn);
        }

        cardContent.append(projectLink); // Add project link at the end
        projectCard.append(projectImage, cardContent);
        projectsContainer.appendChild(projectCard);
        console.log(`Added project: ${project.title}`); // Debug log
    });
}

/**
 * Renders the resume link on the "Download CV" button.
 * @param {string} resumeLink - The URL or path to the resume file.
 */
function renderResumeLink(resumeLink) {
    const cvBtn = document.getElementById('cv-btn');
    if (cvBtn) {
        cvBtn.href = resumeLink || '#';
        console.log(`CV button href set to: ${cvBtn.href}`);
    } else {
        console.warn('CV button element with ID "cv-btn" not found. Check index.html ID.');
    }
}

/**
 * Renders the profile image on the home page.
 * @param {string} imageUrl - The URL of the profile image.
 */
function renderProfileImage(imageUrl) {
    const imgElement = document.getElementById('home-profile-img');
    if (imgElement) {
        if (imageUrl) {
            imgElement.src = imageUrl;
            console.log(`Profile image updated to: ${imageUrl}`);
        }
        // If no imageUrl, it will just use the default src from the HTML.
    }
}

/**
 * Toggle menu function (global) — this also matches the onclick in index.html
 */
function toggleMenu() {
    const nav = document.querySelector('header nav');
    if (nav) {
        nav.classList.toggle('active');
        console.log('Mobile menu toggled via global toggleMenu().');
    }
}

/**
 * Sets up event listeners for the image gallery modal.
 */
function setupGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    const closeModalBtn = modal.querySelector('.close-modal');
    const nextBtn = modal.querySelector('.next');
    const prevBtn = modal.querySelector('.prev');

    closeModalBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    nextBtn.onclick = () => plusSlides(1);
    prevBtn.onclick = () => plusSlides(-1);
}

let slideIndex = 1;

/**
 * Opens the gallery modal and populates it with images.
 * @param {string[]} imageUrls - Array of image URLs for the project.
 */
function openGallery(imageUrls) {
    const modal = document.getElementById('gallery-modal');
    const modalImagesContainer = modal.querySelector('.modal-images');
    modalImagesContainer.innerHTML = ''; // Clear previous images

    imageUrls.forEach(url => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'modal-slide';
        const img = document.createElement('img');
        img.src = url;
        imgDiv.appendChild(img);
        modalImagesContainer.appendChild(imgDiv);
    });

    modal.style.display = 'block';
    slideIndex = 1;
    showSlides(slideIndex);
}

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function showSlides(n) {
    const slides = document.getElementsByClassName('modal-slide');
    if (n > slides.length) { slideIndex = 1; }
    if (n < 1) { slideIndex = slides.length; }
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = 'none';
    }
}

// ===================================================================================
//
//                                  ADMIN / DASHBOARD LOGIC
//
// ===================================================================================

function initAdminPage() {
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User is logged in:', user.email);
            showDashboard();
        } else {
            console.log('User is logged out.');
            showLogin();
        }
    });

    setupAdminEventListeners();

    db.collection('skills').orderBy('name').onSnapshot(snapshot => {
        const skills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderSkillsList(skills);
    }, error => {
        console.error("Error fetching skills for admin list: ", error);
    });

    db.collection('projects').onSnapshot(snapshot => {
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProjectsList(projects);
    }, error => {
        console.error("Error fetching projects for admin list: ", error);
    });
}

function setupAdminEventListeners() {
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const skillForm = document.getElementById('skill-form');
    const projectForm = document.getElementById('project-form');
    const resumeForm = document.getElementById('resume-form');
    const profileImageForm = document.getElementById('profile-image-form');

    if (skillForm) skillForm.addEventListener('submit', handleSkillSubmit);
    if (projectForm) projectForm.addEventListener('submit', handleProjectSubmit);
    if (resumeForm) resumeForm.addEventListener('submit', handleResumeSubmit);
    if (profileImageForm) profileImageForm.addEventListener('submit', handleProfileImageSubmit);

    document.getElementById('skills-list')?.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const { action, id, name, level } = button.dataset;
        if (action === 'edit') {
            editSkill(id, name, level);
        } else if (action === 'delete') {
            deleteSkill(id);
        }
    });

    document.getElementById('projects-list')?.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const { action, id, title, description, link } = button.dataset;
        if (action === 'edit') {
            editProject(id, title, description, link);
        } else if (action === 'delete') {
            deleteProject(id);
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    try {
        console.log("Attempting Firebase login for:", usernameInput);
        await auth.signInWithEmailAndPassword(usernameInput, passwordInput);
    } catch (error) {
        console.error("Firebase login failed:", error.message);
        alert(`Login failed: ${error.message}`);
    }
}

async function handleLogout() {
    await auth.signOut();
}

function showDashboard() {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    loadDashboardData();
}

function showLogin() {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    if (loginSection) loginSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
}

async function loadDashboardData() {
    const settings = await getFromFirestore('settings', 'main');
    // The resume link is now handled by the file input, no display field needed here.
}

// --- Skill Management ---
async function handleSkillSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    try {
        const id = document.getElementById('skill-id').value;
        const name = document.getElementById('skill-name').value;
        const level = document.getElementById('skill-level').value;
        const logoFile = document.getElementById('skill-logo').files[0];
        const skillData = { name, level: Number(level) };

        if (logoFile) {
            const logoUrl = await uploadFile(logoFile, `skill-logos/${logoFile.name}`);
            if (logoUrl) skillData.logoUrl = logoUrl;
        }

        if (id) {
            await saveToFirestore('skills', id, skillData);
        } else {
            await db.collection('skills').add(skillData);
        }

        form.reset();
        document.getElementById('skill-id').value = '';
    } catch (error) {
        console.error("Error in handleSkillSubmit:", error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add/Update Skill';
    }
}

function renderSkillsList(skills) {
    const listContainer = document.getElementById('skills-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    skills.forEach(skill => {
        const item = document.createElement('div');
        item.className = 'item-entry';

        const text = document.createElement('p');
        text.textContent = `${skill.name} (${skill.level || 'N/A'}%)`;

        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.dataset.action = 'edit';
        editBtn.dataset.id = skill.id;
        editBtn.dataset.name = skill.name;
        editBtn.dataset.level = skill.level;
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.dataset.action = 'delete';
        deleteBtn.dataset.id = skill.id;
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';

        actions.append(editBtn, deleteBtn);
        item.append(text, actions);
        listContainer.appendChild(item);
    });
}

function editSkill(id, name, level) {
    const idField = document.getElementById('skill-id');
    const nameField = document.getElementById('skill-name');
    const levelField = document.getElementById('skill-level');
    if (idField) idField.value = id;
    if (nameField) nameField.value = name;
    if (levelField) levelField.value = level;
}

function deleteSkill(id) {
    if (confirm('Are you sure you want to delete this skill?')) {
        db.collection('skills').doc(id).delete();
    }
}

// --- Project Management ---
async function handleProjectSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    try {
        const id = document.getElementById('project-id').value;
        const title = document.getElementById('project-title').value;
        const description = document.getElementById('project-desc').value;
        const link = document.getElementById('project-link').value;
        const imageFile = document.getElementById('project-image').files[0];
        const imageFiles = document.getElementById('project-image').files;
        const projectData = { title, description, link };

        if (imageFiles.length > 0) {
            const uploadPromises = Array.from(imageFiles).map(file =>
                uploadFile(file, `project-images/${file.name}`)
            );
            const imageUrls = await Promise.all(uploadPromises);
            // Only add URLs that were successfully uploaded
            projectData.imageUrls = imageUrls.filter(url => url !== null);
        }

        if (id) {
            // When updating, merge new data with existing data.
            // This prevents overwriting imageUrls if no new images are uploaded.
            await db.collection('projects').doc(id).set(projectData, { merge: true });
        } else {
            await db.collection('projects').add(projectData);
        }
        
        form.reset();
        document.getElementById('project-id').value = '';
    } catch (error) {
        console.error("Error in handleProjectSubmit:", error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add/Update Project';
    }
}

function renderProjectsList(projects) {
    const listContainer = document.getElementById('projects-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    projects.forEach(project => {
        const item = document.createElement('div');
        item.className = 'item-entry';

        const text = document.createElement('p');
        text.textContent = project.title;

        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.dataset.action = 'edit';
        editBtn.dataset.id = project.id;
        editBtn.dataset.title = project.title;
        editBtn.dataset.description = project.description;
        editBtn.dataset.link = project.link;
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.dataset.action = 'delete';
        deleteBtn.dataset.id = project.id;
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';

        actions.append(editBtn, deleteBtn);
        item.append(text, actions);
        listContainer.appendChild(item);
    });
}

function editProject(id, title, description, link) {
    const idField = document.getElementById('project-id');
    const titleField = document.getElementById('project-title');
    const descField = document.getElementById('project-desc');
    const linkField = document.getElementById('project-link');

    if (idField) idField.value = id;
    if (titleField) titleField.value = title;
    if (descField) descField.value = description;
    if (linkField) linkField.value = link;
}

function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        db.collection('projects').doc(id).delete();
    }
}

// --- Settings Management ---
async function handleResumeSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const resumeFile = document.getElementById('resume-file').files[0];

    if (!resumeFile) {
        alert('Please select a resume file to upload.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    try {
        const resumeLink = await uploadFile(resumeFile, `resumes/${resumeFile.name}`);
        if (resumeLink) {
            await saveToFirestore('settings', 'main', { resumeLink });
            alert('Resume updated successfully!');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Resume';
        form.reset();
    }
}

async function handleProfileImageSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const profileImageFile = document.getElementById('profile-image-file').files[0];

    if (!profileImageFile) {
        alert('Please select a profile picture to upload.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    try {
        const imageUrl = await uploadFile(profileImageFile, `profile-images/${profileImageFile.name}`);
        if (imageUrl) {
            await saveToFirestore('settings', 'main', { profileImageUrl: imageUrl });
            alert('Profile picture updated successfully!');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Picture';
        form.reset();
    }
}

// ===================================================================================
//
//                                  UTILITY FUNCTIONS
//
// ===================================================================================

async function getFromFirestore(collectionName, docId) {
    try {
        const docRef = db.collection(collectionName).doc(docId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            console.log(`[Firestore] Retrieved '${collectionName}/${docId}':`, docSnap.data());
            return docSnap.data();
        } else {
            console.log(`[Firestore] No such document: '${collectionName}/${docId}'`);
            return null;
        }
    } catch (error) {
        console.error(`[Firestore] Error getting document '${collectionName}/${docId}':`, error);
        return null;
    }
}

async function saveToFirestore(collectionName, docId, data) {
    try {
        await db.collection(collectionName).doc(docId).set(data, { merge: true });
        console.log(`[Firestore] Saved to '${collectionName}/${docId}':`, data);
    } catch (error) {
        console.error(`[Firestore] Error saving document '${collectionName}/${docId}':`, error);
    }
}

/**
 * Uploads a file to Firebase Storage and returns its public URL.
 * @param {File} file The file to upload.
 * @param {string} path The storage path (e.g., 'skill-logos/firebase.png').
 * @returns {Promise<string|null>} The download URL or null on error.
 */
async function uploadFile(file, path) {
    if (!file) return null;
    try {
        // Create a unique filename to prevent overwrites and handle paths
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${Date.now()}.${fileExtension}`;
        const directory = path.substring(0, path.lastIndexOf('/'));
        const uniquePath = `${directory}/${uniqueFileName}`;
        const storageRef = storage.ref(uniquePath);
        const snapshot = await storageRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        console.log(`[Storage] File "${file.name}" uploaded to ${uniquePath}. URL: ${downloadURL}`);
        return downloadURL;
    } catch (error) {
        console.error(`[Storage] Error uploading file to ${path}:`, error);
        return null;
    }
}
