    let globalSession = null;
    let currentProjectMediaGallery = [];

    document.addEventListener('DOMContentLoaded', async () => {
      if (!supabase) {
        Swal.fire({
          icon: 'error',
          title: 'Configuración Requerida',
          text: 'Supabase no estÃ¡ configurado. Edita js/config.js para poder operar el panel.',
          confirmButtonColor: '#2091F9'
        });
        return;
      }

      // Validar si existe sesiÃ³n activa al cargar
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        onUserAuthenticated(session);
      } else {
        document.getElementById('auth-container').style.display = 'flex';
        document.getElementById('dashboard-container').style.display = 'none';
      }

      // Escuchar cambios de estado en la autenticaciÃ³n
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          onUserAuthenticated(session);
        } else {
          document.getElementById('auth-container').style.display = 'flex';
          document.getElementById('dashboard-container').style.display = 'none';
        }
      });

      // Manejar Formulario de Login
      const loginForm = document.getElementById('login-form');
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('btn-login-submit');

        btn.disabled = true;
        btn.textContent = "Verificando...";

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          Swal.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: 'Error de autenticaciÃ³n: ' + error.message,
            confirmButtonColor: '#ef4444'
          });
          btn.disabled = false;
          btn.textContent = "Ingresar al Dashboard";
        }
      });

      // Manejar Formulario de Proyecto (Crear / Editar)
      const projectForm = document.getElementById('project-form');
      projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProject();
      });

      // Manejar Formulario de GalerÃ­a
      const galleryForm = document.getElementById('gallery-form');
      galleryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveGalleryItem();
      });

      // Cerrar sesiÃ³n
      document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabase.auth.signOut();
      });
    });

    function onUserAuthenticated(session) {
      globalSession = session;
      document.getElementById('auth-container').style.display = 'none';
      document.getElementById('dashboard-container').style.display = 'block';
      document.getElementById('user-email-display').textContent = session.user.email;
      
      // Cargar data por defecto
      loadProjects();
      loadGallery();
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      // Activar la pestaÃ±a correcta
      const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.textContent.toLowerCase().includes(tabId === 'projects-tab' ? 'proyectos' : 'galer'));
      if (targetBtn) targetBtn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    }

    // --- LOGICA DE PROYECTOS ---
    async function loadProjects() {
      const tbody = document.getElementById('projects-table-body');
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando proyectos...</td></tr>';

      try {
        const { data: proyectos, error } = await supabase
          .from('proyectos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!proyectos || proyectos.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">No hay proyectos creados.</td></tr>';
          return;
        }

        tbody.innerHTML = '';
        proyectos.forEach(p => {
          const tr = document.createElement('tr');
          
          let mediaHtml = '';
          if (p.media_type === 'video') {
            mediaHtml = `<div style="position:relative;"><video class="project-row-img" poster="${p.poster || ''}"></video><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:12px;background:rgba(0,0,0,0.5);border-radius:50%;padding:2px 5px;">â–¶</span></div>`;
          } else {
            mediaHtml = `<img src="${p.media_src}" alt="media" class="project-row-img" onerror="this.src='../images/MovTrafo.jpeg'">`;
          }

          const visibilityHtml = p.active !== false
            ? `<span class="badge" style="background-color: #d1fae5; color: #065f46;">Activo</span>`
            : `<span class="badge" style="background-color: #f3f4f6; color: #374151;">Inhabilitado</span>`;

          const actionBtnHtml = p.active !== false
            ? `<button class="btn-action btn-delete" style="color: #64748b; border-color: #cbd5e1; display: inline-flex; align-items: center; justify-content: center; padding: 6px;" title="Inhabilitar Proyecto" onclick="toggleProjectStatus('${p.id}', true)">
                <svg style="width:18px;height:18px" viewBox="0 0 24 24"><path fill="currentColor" d="M11.83,9L15,12.17C15,12.11 15,12.06 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.23,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3,8.38 1.63,10.06 1,12C2.73,16.39 7,19.5 12,19.5C13.79,19.5 15.46,19.1 16.97,18.39L17.43,18.85L19.73,21.15L21,19.88L3.27,2.12L2,4.27M12,7A5,5 0 0,1 14.8,8.2L16.62,10.02C16.86,10.63 17,11.3 17,12C17,12.78 16.8,13.53 16.47,14.2L18.47,16.2C19.82,15 20.91,13.43 21.61,11.61C19.92,7.39 15.77,4.5 11,4.5C9.6,4.5 8.27,4.74 7,5.18L8.83,7C9.79,6.56 10.87,6.33 12,7M12,4.5L12,4.5Z" /></svg>
               </button>`
            : `<button class="btn-action" style="color: var(--success); border-color: rgba(16, 185, 129, 0.2); display: inline-flex; align-items: center; justify-content: center; padding: 6px;" title="Habilitar Proyecto" onclick="toggleProjectStatus('${p.id}', false)">
                <svg style="width:18px;height:18px" viewBox="0 0 24 24"><path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17Z" /></svg>
               </button>`;

          tr.innerHTML = `
            <td>${mediaHtml}</td>
            <td style="font-weight:600; ${p.active === false ? 'opacity: 0.5;' : ''}">${p.title}</td>
            <td style="${p.active === false ? 'opacity: 0.5;' : ''}">${p.location}</td>
            <td><span class="badge badge-service">${p.service}</span></td>
            <td><span class="badge badge-voltage">${p.voltage}</span></td>
            <td style="${p.active === false ? 'opacity: 0.5;' : ''}">${p.client}</td>
            <td style="${p.active === false ? 'opacity: 0.5;' : ''}">${p.status}</td>
            <td>${visibilityHtml}</td>
            <td>
              <div class="actions-cell">
                <button class="btn-action btn-edit" style="color: var(--primary); border-color: rgba(32, 145, 249, 0.2); display: inline-flex; align-items: center; justify-content: center; padding: 6px;" title="Editar Proyecto" onclick="editProject('${p.id}')">
                  <svg style="width:18px;height:18px" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.07,6.19L3,17.25Z" /></svg>
                </button>
                ${actionBtnHtml}
              </div>
            </td>
          `;
          tbody.appendChild(tr);
        });
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--danger);">Error: ${err.message}</td></tr>`;
      }
    }

    function openProjectModal(isEdit = false) {
      document.getElementById('project-modal').style.display = 'flex';
      const form = document.getElementById('project-form');
      form.reset();
      
      currentProjectMediaGallery = [];
      renderProjectGalleryUI();

      if (!isEdit) {
        document.getElementById('modal-project-title').textContent = "Nuevo Proyecto";
        document.getElementById('project-db-mode').value = "create";
        document.getElementById('proj-id').disabled = false;
        document.getElementById('proj-active').checked = true;
      }
    }

    function closeProjectModal() {
      document.getElementById('project-modal').style.display = 'none';
    }

    async function editProject(id) {
      openProjectModal(true);
      document.getElementById('modal-project-title').textContent = "Editar Proyecto";
      document.getElementById('project-db-mode').value = "edit";
      document.getElementById('proj-id').disabled = true;

      try {
        const { data: p, error } = await supabase
          .from('proyectos')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        document.getElementById('proj-id').value = p.id;
        document.getElementById('proj-title').value = p.title;
        document.getElementById('proj-location').value = p.location;
        document.getElementById('proj-client').value = p.client;
        document.getElementById('proj-service').value = p.service;
        document.getElementById('proj-voltage').value = p.voltage;
        document.getElementById('proj-status').value = p.status;
        document.getElementById('proj-description').value = p.description;
        document.getElementById('proj-active').checked = p.active !== false;

        // Cargar galerÃ­a
        currentProjectMediaGallery = p.media_gallery;
        if (!currentProjectMediaGallery || !Array.isArray(currentProjectMediaGallery) || currentProjectMediaGallery.length === 0) {
          // Fallback para proyectos antiguos migrados sin galerÃ­a de array
          if (p.media_src) {
            currentProjectMediaGallery = [{
              type: p.media_type || 'image',
              src: p.media_src,
              poster: p.poster || null
            }];
          } else {
            currentProjectMediaGallery = [];
          }
        }
        renderProjectGalleryUI();

      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error cargando detalles del proyecto: ' + err.message,
          confirmButtonColor: '#ef4444'
        });
        closeProjectModal();
      }
    }

    function renderProjectGalleryUI() {
      const grid = document.getElementById('proj-gallery-grid');
      grid.innerHTML = '';

      if (currentProjectMediaGallery.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.85rem; margin: 10px 0;">La galerÃ­a estÃ¡ vacÃ­a. AÃ±ade imÃ¡genes o videos.</p>';
        return;
      }

      currentProjectMediaGallery.forEach((item, index) => {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '90px';
        container.style.borderRadius = '6px';
        container.style.overflow = 'hidden';
        container.style.border = '1px solid var(--border-color)';

        let mediaHtml = '';
        if (item.type === 'video') {
          mediaHtml = `
            <div style="width:100%; height:100%; position:relative; background:#000;">
              <video style="width:100%; height:100%; object-fit:cover;" src="${item.src}" poster="${item.poster || ''}"></video>
              <span style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:white; font-size:10px; background:rgba(0,0,0,0.6); border-radius:50%; padding:2px 4px; pointer-events:none;">â–¶</span>
            </div>
          `;
        } else {
          mediaHtml = `<img style="width:100%; height:100%; object-fit:cover;" src="${item.src}" alt="img">`;
        }

        container.innerHTML = `
          ${mediaHtml}
          <button type="button" onclick="removeProjectGalleryItem(${index})" style="position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: rgba(239, 68, 68, 0.9); color: white; border: none; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.3);" title="Quitar archivo">Ã—</button>
        `;
        grid.appendChild(container);
      });
    }

    function removeProjectGalleryItem(index) {
      currentProjectMediaGallery.splice(index, 1);
      renderProjectGalleryUI();
    }

    async function handleProjectGalleryUpload(input, type) {
      const file = input.files[0];
      if (!file) return;

      Swal.fire({
        title: 'Subiendo archivo...',
        text: 'Por favor espera a que la subida finalice.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const publicUrl = await uploadToStorage(file, 'projects');
        let posterUrl = null;

        if (type === 'video') {
          // Preguntar por miniatura/poster opcional usando Swal.fire
          const { value: posterFile } = await Swal.fire({
            title: 'Miniatura de Video',
            text: 'Selecciona una imagen de poster/miniatura para este video (opcional)',
            input: 'file',
            inputAttributes: {
              accept: 'image/*'
            },
            showCancelButton: true,
            confirmButtonText: 'Subir Miniatura',
            cancelButtonText: 'Omitir'
          });

          if (posterFile) {
            Swal.fire({
              title: 'Subiendo miniatura...',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });
            posterUrl = await uploadToStorage(posterFile, 'posters');
          }
        }

        currentProjectMediaGallery.push({
          type: type,
          src: publicUrl,
          poster: posterUrl
        });

        renderProjectGalleryUI();
        Swal.close();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error de Carga',
          text: 'OcurriÃ³ un error al subir el archivo: ' + err.message,
          confirmButtonColor: '#ef4444'
        });
      } finally {
        input.value = ''; // Limpiar selector
      }
    }

    async function uploadToStorage(file, folder = 'media') {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('landing-media')
        .upload(fileName, file);

      if (error) {
        console.warn("Storage upload failed: ", error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('landing-media')
        .getPublicUrl(fileName);

      return publicUrl;
    }

    async function saveProject() {
      const mode = document.getElementById('project-db-mode').value;
      const id = document.getElementById('proj-id').value.trim();
      const title = document.getElementById('proj-title').value.trim();
      const location = document.getElementById('proj-location').value.trim();
      const client = document.getElementById('proj-client').value.trim();
      const service = document.getElementById('proj-service').value.trim();
      const voltage = document.getElementById('proj-voltage').value.trim();
      const status = document.getElementById('proj-status').value.trim();
      const description = document.getElementById('proj-description').value.trim();
      const active = document.getElementById('proj-active').checked;

      if (currentProjectMediaGallery.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'GalerÃ­a VacÃ­a',
          text: 'Debes aÃ±adir al menos una imagen o video a la galerÃ­a del proyecto.',
          confirmButtonColor: '#2091F9'
        });
        return;
      }

      try {
        const projectPayload = {
          title,
          location,
          client,
          service,
          voltage,
          status,
          description,
          active,
          media_gallery: currentProjectMediaGallery,
          // Compatibilidad: poblar los campos principales con el primer item de la galerÃ­a
          media_type: currentProjectMediaGallery[0].type,
          media_src: currentProjectMediaGallery[0].src,
          poster: currentProjectMediaGallery[0].poster || null
        };

        if (mode === 'create') {
          projectPayload.id = id;
          const { error } = await supabase.from('proyectos').insert([projectPayload]);
          if (error) throw error;
          Swal.fire({
            icon: 'success',
            title: 'Creado',
            text: 'Proyecto creado con Ã©xito.',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          const { error } = await supabase.from('proyectos').update(projectPayload).eq('id', id);
          if (error) throw error;
          Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'Proyecto actualizado con Ã©xito.',
            timer: 2000,
            showConfirmButton: false
          });
        }

        closeProjectModal();
        loadProjects();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error al Guardar',
          text: err.message + '. AsegÃºrate de que la estructura de tu tabla contenga el campo "media_gallery".',
          confirmButtonColor: '#ef4444'
        });
      }
    }

    async function toggleProjectStatus(id, currentActive) {
      const newActive = !currentActive;
      const confirmTitle = newActive ? "Â¿Habilitar Proyecto?" : "Â¿Inhabilitar Proyecto?";
      const confirmText = newActive
        ? "Este proyecto volverÃ¡ a ser visible pÃºblicamente en la Landing Page."
        : "Este proyecto se ocultarÃ¡ temporalmente de la Landing Page.";

      const result = await Swal.fire({
        title: confirmTitle,
        text: confirmText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: newActive ? '#10b981' : '#64748b',
        cancelButtonColor: '#e2e8f0',
        confirmButtonText: newActive ? 'SÃ­, habilitar' : 'SÃ­, inhabilitar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;

      try {
        const { error } = await supabase
          .from('proyectos')
          .update({ active: newActive })
          .eq('id', id);

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: newActive ? 'Proyecto Habilitado' : 'Proyecto Inhabilitado',
          timer: 1500,
          showConfirmButton: false
        });
        loadProjects();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cambiar el estado del proyecto: ' + err.message,
          confirmButtonColor: '#ef4444'
        });
      }
    }

    // --- LOGICA DE GALERÃA ---
    async function loadGallery() {
      const grid = document.getElementById('gallery-grid-container');
      grid.innerHTML = '<p style="text-align:center;grid-column: 1/-1;">Cargando fotos...</p>';

      try {
        const { data: fotos, error } = await supabase
          .from('galeria')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (!fotos || fotos.length === 0) {
          grid.innerHTML = '<p style="text-align:center;grid-column: 1/-1;color:var(--text-muted);">La galerÃ­a estÃ¡ vacÃ­a.</p>';
          return;
        }

        grid.innerHTML = '';
        fotos.forEach(foto => {
          const card = document.createElement('div');
          card.className = 'gallery-item-card';
          card.innerHTML = `
            <img src="${foto.img_src}" alt="${foto.alt_text}" onerror="this.src='../images/MovTrafo.jpeg'">
            <div class="gallery-item-info">
              <p class="gallery-item-name" title="${foto.alt_text}">${foto.alt_text}</p>
              <button class="btn-action btn-delete" style="padding: 3px 8px; font-size: 0.75rem;" onclick="deleteGalleryItem(${foto.id})">Eliminar</button>
            </div>
          `;
          grid.appendChild(card);
        });
      } catch (err) {
        grid.innerHTML = `<p style="text-align:center;grid-column: 1/-1;color:var(--danger);">Error: ${err.message}</p>`;
      }
    }

    function openGalleryModal() {
      document.getElementById('gallery-modal').style.display = 'flex';
      const form = document.getElementById('gallery-form');
      form.reset();
      document.getElementById('gal-img-preview').style.display = 'none';
      document.getElementById('gal-file-status').textContent = "Seleccionar foto";
    }

    function closeGalleryModal() {
      document.getElementById('gallery-modal').style.display = 'none';
    }

    async function saveGalleryItem() {
      const alt_text = document.getElementById('gal-alt').value.trim();
      let img_src = document.getElementById('gal-src').value.trim();
      const fileInput = document.getElementById('gal-file');

      try {
        if (fileInput.files.length > 0) {
          img_src = await uploadToStorage(fileInput.files[0], 'gallery');
        }

        if (!img_src) {
          Swal.fire({
            icon: 'warning',
            title: 'Imagen Requerida',
            text: 'Debes seleccionar una imagen para subir o especificar su URL.',
            confirmButtonColor: '#2091F9'
          });
          return;
        }

        const { error } = await supabase
          .from('galeria')
          .insert([{ img_src, alt_text }]);

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Imagen Subida',
          text: 'Imagen subida a la galerÃ­a con Ã©xito.',
          timer: 2000,
          showConfirmButton: false
        });
        closeGalleryModal();
        loadGallery();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error al Subir',
          text: err.message + '. AsegÃºrate de que el bucket de storage "landing-media" exista.',
          confirmButtonColor: '#ef4444'
        });
      }
    }

    async function deleteGalleryItem(id) {
      const result = await Swal.fire({
        title: 'Â¿Eliminar Imagen?',
        text: "Esta foto se borrarÃ¡ de forma permanente de tu galerÃ­a de carrusel.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#e2e8f0',
        confirmButtonText: 'SÃ­, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;

      try {
        const { error } = await supabase
          .from('galeria')
          .delete()
          .eq('id', id);

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Eliminada',
          text: 'Imagen eliminada de la galerÃ­a.',
          timer: 1500,
          showConfirmButton: false
        });
        loadGallery();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar: ' + err.message,
          confirmButtonColor: '#ef4444'
        });
      }
    }
