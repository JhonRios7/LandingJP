document.addEventListener('DOMContentLoaded', function () {
  // Interactividad secciones - símbolo hamburguesa móvil.
  const menuButton = document.querySelector('.nav__menu');
  const closeButton = document.querySelector('.nav__close');
  const navLinks = document.querySelector('.nav__link--menu');

  menuButton.addEventListener('click', () => {
    navLinks.classList.add('nav__link--show');
  });

  closeButton.addEventListener('click', () => {
    navLinks.classList.remove('nav__link--show');
  });


  // Cargar proyectos y galería desde Supabase
  if (typeof supabase !== 'undefined' && supabase !== null) {
    cargarProyectosDesdeSupabase();
    cargarGaleriaDesdeSupabase();
  } else {
    console.warn("Supabase no está inicializado o configurado. Por favor edita js/config.js.");
  }

  async function cargarProyectosDesdeSupabase() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    try {
      const { data: proyectos, error } = await supabase
        .from('proyectos')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!proyectos || proyectos.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #64748b; padding: 40px 0;">No hay proyectos disponibles en este momento.</p>';
        return;
      }

      grid.innerHTML = ''; // Limpiar loader

      proyectos.forEach(p => {
        const card = document.createElement('a');
        card.href = `proyecto.html?id=${p.id}`;
        card.className = 'project__card';

        if (p.media_type === 'video') {
          card.innerHTML = `
            <video
              class="project__image"
              autoplay
              muted
              loop
              playsinline
              preload="metadata"
              poster="${p.poster || ''}"
            >
              <source src="${p.media_src}" type="video/mp4" />
              Tu navegador no soporta la reproducción de video.
            </video>
            <p class="project__location">${p.location}</p>
          `;
        } else {
          card.innerHTML = `
            <img src="${p.media_src}" alt="${p.title}" class="project__image" loading="lazy" />
            <p class="project__location">${p.location}</p>
          `;
        }
        grid.appendChild(card);
      });

    } catch (err) {
      console.error("Error cargando proyectos:", err);
      grid.innerHTML = `<p style="text-align: center; grid-column: 1 / -1; color: #dc2626; padding: 40px 0;">Error al cargar proyectos: ${err.message || err}</p>`;
    }
  }

  async function cargarGaleriaDesdeSupabase() {
    const container = document.getElementById('gallery-carousel-container');
    if (!container) return;

    try {
      const { data: fotos, error } = await supabase
        .from('galeria')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!fotos || fotos.length === 0) {
        container.innerHTML = '<p style="text-align: center; width: 100%; color: #64748b; padding: 40px 0;">No hay fotos en la galería.</p>';
        return;
      }

      container.innerHTML = ''; // Limpiar loader

      // Crear radio buttons
      fotos.forEach((foto, index) => {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'slides';
        radio.id = `slide-${index + 1}`;
        if (index === 0) radio.checked = true;
        container.appendChild(radio);
      });

      // Crear contenedor de slides grandes
      const slidesWrapper = document.createElement('div');
      slidesWrapper.className = 'carousel__slides';
      fotos.forEach((foto, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel__slide';
        slide.id = `image-${index + 1}`;
        slide.innerHTML = `<img src="${foto.img_src}" alt="${foto.alt_text}" loading="lazy" />`;
        slidesWrapper.appendChild(slide);
      });
      container.appendChild(slidesWrapper);

      // Crear contenedor de miniaturas
      const thumbnailsWrapper = document.createElement('div');
      thumbnailsWrapper.className = 'carousel__thumbnails';
      fotos.forEach((foto, index) => {
        const label = document.createElement('label');
        label.setAttribute('for', `slide-${index + 1}`);
        label.innerHTML = `<img src="${foto.img_src}" alt="${foto.alt_text}" loading="lazy" />`;
        thumbnailsWrapper.appendChild(label);
      });
      container.appendChild(thumbnailsWrapper);

      // Inicializar comportamiento del carrusel dinámico
      initDynamicCarousel();

    } catch (err) {
      console.error("Error cargando galería:", err);
      container.innerHTML = `<p style="text-align: center; width: 100%; color: #dc2626; padding: 40px 0;">Error al cargar galería: ${err.message || err}</p>`;
    }
  }

  function initDynamicCarousel() {
    const radioButtons = document.querySelectorAll('input[name="slides"]');
    const slides = document.querySelectorAll('.carousel__slide');

    function showSlide() {
      slides.forEach((slide, index) => {
        if (radioButtons[index] && radioButtons[index].checked) {
          slide.style.display = "block";
          slide.style.opacity = "1";
        } else {
          slide.style.display = "none";
          slide.style.opacity = "0";
        }
      });
    }

    radioButtons.forEach((radio) => {
      radio.addEventListener('change', showSlide);
    });

    showSlide(); // Cargar la primera imagen
  }

  // Inicializar EmailJS con configuración centralizada (SDK v4)
  if (typeof EMAILJS_CONFIG !== 'undefined' && EMAILJS_CONFIG.PUBLIC_KEY) {
    emailjs.init({
      publicKey: EMAILJS_CONFIG.PUBLIC_KEY
    });
  } else {
    console.warn("EmailJS no está configurado. Por favor define EMAILJS_CONFIG en js/config.js.");
  }

  // Manejar el envío del formulario de contacto
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Validación de campos
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();
      const submitBtn = contactForm.querySelector('button[type="submit"]');

      if (!name || !email || !message) {
        Swal.fire({
          icon: 'warning',
          title: 'Campos Incompletos',
          text: 'Por favor, completa todos los campos antes de enviar tu mensaje.',
          confirmButtonColor: '#2091F9'
        });
        return;
      }

      if (typeof EMAILJS_CONFIG === 'undefined' || !EMAILJS_CONFIG.PUBLIC_KEY || EMAILJS_CONFIG.PUBLIC_KEY.includes("TU_EMAILJS")) {
        Swal.fire({
          icon: 'error',
          title: 'Error de Configuración',
          text: 'Las credenciales de EmailJS no están configuradas en js/config.js.',
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      // Estado de carga en el botón
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando mensaje...";

      // Enviar el correo usando EmailJS
      emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, {
        name: name,
        email: email,
        message: message,
      })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: '¡Mensaje Enviado!',
          text: 'Tu solicitud de cotización se ha enviado con éxito. Nos pondremos en contacto contigo lo antes posible.',
          confirmButtonColor: '#2091F9'
        });
        contactForm.reset();
      })
      .catch((error) => {
        console.error("Error de EmailJS:", error);
        const errorMsg = error ? (error.text || error.message || JSON.stringify(error)) : 'Error desconocido';
        Swal.fire({
          icon: 'error',
          title: 'Error al Enviar',
          text: 'Ocurrió un error al enviar: ' + errorMsg,
          confirmButtonColor: '#ef4444'
        });
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      });
    });
  }
});
