// Inicialización del cliente de Supabase
// Asegúrate de que el script CDN de Supabase se cargue antes que este archivo.
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

(function() {
  if (typeof supabase !== 'undefined') {
    const { createClient } = supabase;
    if (SUPABASE_CONFIG.URL === "TU_SUPABASE_URL" || SUPABASE_CONFIG.ANON_KEY === "TU_SUPABASE_ANON_KEY") {
      console.warn("Supabase no ha sido configurado. Por favor edita js/config.js con tus credenciales.");
      window.supabase = null;
    } else {
      // Reemplazamos la biblioteca por la instancia del cliente
      window.supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
      console.log("Cliente de Supabase inicializado correctamente.");
    }
  } else {
    console.error("No se pudo cargar la biblioteca de Supabase. Asegúrate de incluir el script de la CDN en tu HTML.");
  }
})();
