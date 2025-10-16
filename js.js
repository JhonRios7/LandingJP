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

  // Animación de escala en hover para proyectos
  const projects = document.querySelectorAll('.project');
  projects.forEach(project => {
    project.addEventListener('mouseenter', () => {
      project.style.transform = 'scale(1.05)';
    });
    project.addEventListener('mouseleave', () => {
      project.style.transform = 'scale(1)';
    });
  });

  // Carrusel: Seleccionamos todos los inputs y las imágenes grandes
  const radioButtons = document.querySelectorAll('input[name="slides"]');
  const slides = document.querySelectorAll('.carousel__slide');

  function showSlide() {
    slides.forEach((slide, index) => {
      if (radioButtons[index].checked) {
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

  window.addEventListener('load', showSlide);

  // Inicializa EmailJS con la API Key Pública
  emailjs.init('rT99C_VVaJQI4966A'); //API Key Pública de EmailJS

  // Maneja el envío del formulario
  const contactForm = document.getElementById('contactForm');
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validación de formulario
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      alert('Por favor, completa todos los campos antes de enviar.');
      return;
    }

    // Envía los datos a través de EmailJS
    emailjs.send('service_7n2mmdj', 'template_7cwu7wm', {
      name: name,
      email: email,
      message: message,
    })
      .then(() => {
        alert('Mensaje enviado correctamente');
        contactForm.reset();
      })
      .catch((error) => {
        alert('Ocurrió un error al enviar el mensaje: ' + error);
      });
  });
});
