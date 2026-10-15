    document.addEventListener('DOMContentLoaded', async () => {
      // 1. Obtener ID de la URL
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('id');

      if (!projectId) {
        mostrarError();
        return;
      }

      if (!supabase) {
        console.warn("Supabase no configurado.");
        mostrarError("Configura Supabase en js/config.js para visualizar los proyectos.");
        return;
      }

      // 2. Buscar proyecto en Supabase
      try {
        const { data: project, error } = await supabase
          .from('proyectos')
          .select('*')
          .eq('id', projectId)
          .eq('active', true)
          .single();

        if (error || !project) {
          mostrarError();
          return;
        }

        // 3. Rellenar información en la página
        document.title = `${project.title} | Subestaciones Montajes JP`;
        document.getElementById('breadcrumb-current').textContent = project.title;
        document.getElementById('project-main-title').textContent = project.title;
        document.getElementById('project-main-subtitle').textContent = project.location;
        document.getElementById('project-title-specs').textContent = "Especificaciones";
        document.getElementById('project-title-description').textContent = "Descripción del Trabajo";
        document.getElementById('project-description-text').textContent = project.description;

        // Cambiar fondo del hero dinámicamente con la imagen/video del proyecto
        const heroElement = document.querySelector('.hero--project');
        const heroBg = project.media_type === 'image' ? project.media_src : (project.poster || 'images/fondo.jpeg');
        heroElement.style.backgroundImage = `linear-gradient(180deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("${heroBg}")`;

        // Inyectar Ficha Técnica
        document.getElementById('spec-location').textContent = project.location;
        document.getElementById('spec-service').textContent = project.service;
        document.getElementById('spec-voltage').textContent = project.voltage;
        document.getElementById('spec-client').textContent = project.client;
        document.getElementById('spec-status').textContent = project.status;

        // Inyectar Media (Carrusel dinámico con múltiples fotos/videos)
        const mediaContainer = document.getElementById('project-media');
        
        // Obtener la galería. Si no tiene o está vacía, usamos el archivo principal como fallback
        let gallery = project.media_gallery;
        if (!gallery || !Array.isArray(gallery) || gallery.length === 0) {
          gallery = [{
            type: project.media_type || 'image',
            src: project.media_src,
            poster: project.poster
          }];
        }

        let sliderHtml = `
          <div class="project-slider">
            <div class="slider-track" id="slider-track">
        `;

        gallery.forEach(item => {
          sliderHtml += `<div class="slider-slide">`;
          if (item.type === 'video') {
            sliderHtml += `
              <video autoplay muted loop playsinline controls poster="${item.poster || ''}">
                <source src="${item.src}" type="video/mp4" />
                Tu navegador no soporta la reproducción de video.
              </video>
            `;
          } else {
            sliderHtml += `<img src="${item.src}" alt="${project.title}" />`;
          }
          sliderHtml += `</div>`;
        });

        sliderHtml += `
            </div>
        `;

        // Solo agregar flechas y dots si hay más de 1 elemento multimedia
        if (gallery.length > 1) {
          sliderHtml += `
            <button class="slider-arrow slider-prev" id="slider-prev-btn">&lt;</button>
            <button class="slider-arrow slider-next" id="slider-next-btn">&gt;</button>
            <div class="slider-dots" id="slider-dots">
          `;
          gallery.forEach((_, idx) => {
            sliderHtml += `<div class="slider-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></div>`;
          });
          sliderHtml += `</div>`;
        }

        sliderHtml += `</div>`;
        mediaContainer.innerHTML = sliderHtml;

        // Inicializar el control del slider
        if (gallery.length > 1) {
          initProjectSlider(gallery.length);
        }

        // 4. Cargar Proyectos Relacionados (3 proyectos aleatorios excluyendo el actual)
        cargarProyectosRelacionados(projectId);

      } catch (err) {
        console.error("Error al cargar el proyecto:", err);
        mostrarError("Ocurrió un error al cargar el proyecto.");
      }

      // 5. Configurar menú hamburguesa para versión móvil
      const menuButton = document.querySelector('.nav__menu');
      const closeButton = document.querySelector('.nav__close');
      const navLinks = document.querySelector('.nav__link--menu');

      menuButton.addEventListener('click', () => {
        navLinks.classList.add('nav__link--show');
      });

      closeButton.addEventListener('click', () => {
        navLinks.classList.remove('nav__link--show');
      });
    });

    function mostrarError(mensajeCustom) {
      document.querySelector('.project-detail-section').style.display = 'none';
      const errContainer = document.getElementById('error-container');
      errContainer.style.display = 'block';
      if (mensajeCustom) {
        errContainer.querySelector('p').textContent = mensajeCustom;
      }
      document.title = "Proyecto No Encontrado - Subestaciones Montajes JP";
    }

    async function cargarProyectosRelacionados(currentId) {
      const relatedGrid = document.getElementById('related-grid');
      if (!relatedGrid) return;

      try {
        // Consulta todos los proyectos excepto el actual
        const { data: todosProyectos, error } = await supabase
          .from('proyectos')
          .select('*')
          .eq('active', true)
          .neq('id', currentId);

        if (error || !todosProyectos || todosProyectos.length === 0) {
          relatedGrid.innerHTML = '<p style="color: #64748b;">No hay otros proyectos destacados.</p>';
          return;
        }

        // Seleccionar 3 aleatorios
        const shuffled = todosProyectos.sort(() => 0.5 - Math.random());
        const relacionados = shuffled.slice(0, 3);

        relatedGrid.innerHTML = ''; // Limpiar

        relacionados.forEach(p => {
          const cardLink = document.createElement('a');
          cardLink.href = `proyecto.html?id=${p.id}`;
          cardLink.className = 'project__card';

          if (p.media_type === 'video') {
            cardLink.innerHTML = `
              <video class="project__image" autoplay muted loop playsinline preload="metadata" poster="${p.poster || ''}">
                <source src="${p.media_src}" type="video/mp4" />
              </video>
              <p class="project__location">${p.location}</p>
            `;
          } else {
            cardLink.innerHTML = `
              <img src="${p.media_src}" alt="${p.title}" class="project__image" />
              <p class="project__location">${p.location}</p>
            `;
          }
          relatedGrid.appendChild(cardLink);
        });
      } catch (err) {
        console.error("Error al cargar proyectos relacionados:", err);
      }
    }

    function initProjectSlider(slideCount) {
      const track = document.getElementById('slider-track');
      const prevBtn = document.getElementById('slider-prev-btn');
      const nextBtn = document.getElementById('slider-next-btn');
      const dots = document.querySelectorAll('.slider-dot');
      
      let currentIndex = 0;

      function goToSlide(index) {
        if (index < 0) {
          currentIndex = slideCount - 1;
        } else if (index >= slideCount) {
          currentIndex = 0;
        } else {
          currentIndex = index;
        }
        
        // Desplazar el track
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Actualizar dots
        dots.forEach((dot, idx) => {
          if (idx === currentIndex) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }

      if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
      if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
      
      dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
          const index = parseInt(e.target.getAttribute('data-index'));
          goToSlide(index);
        });
      });
    }
