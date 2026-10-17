// Módulo de validación y seguridad para UNA Chat

module.exports = {

  // Lógica que valida si un teléfono está correcto
  is_valid_phone: function (phone) {
    var isValid = false;
    var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;
    try {
      isValid = re.test(phone);
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
  },

  // Paso 4 y 5: Valida si una URL apunta a una imagen válida
  is_valid_url_image: function (url) {
    if (!url || typeof url !== 'string') return false;
    var isValid = false;
    // Expresión regular para imágenes válidas (jpg, jpeg, png, gif, bmp, webp)
    var re = /^https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|bmp|webp)(?:\?[^\s<>"']*)?$/i;
    try {
      isValid = re.test(url.trim());
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
  },

  // Paso 4 y 5: Valida si una URL corresponde a un video de YouTube
  is_valid_yt_video: function (url) {
    if (!url || typeof url !== 'string') return false;
    var isValid = false;
    // Expresión regular para videos de YouTube (enlace largo, corto youtu.be, embed o shorts)
    var re = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})(?:\S*)?$/i;
    try {
      isValid = re.test(url.trim());
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
  },

  // Paso 5: Detecta si un texto contiene inyección de scripts o eventos maliciosos (XSS)
  is_script_injection: function (str) {
    if (!str || typeof str !== 'string') return false;
    var re = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<[^>]+on\w+\s*=|javascript:/i;
    return re.test(str);
  },

  // Extrae el ID del video de YouTube
  getYTVideoId: function (url) {
    if (!url || typeof url !== 'string') return '';
    var match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    return match ? match[1] : '';
  },

  // Paso 4: Inserta el reproductor de video (iframe)
  getEmbeddedCode: function (url) {
    var id = this.getYTVideoId(url);
    if (!id) return this.sanitize(url);
    return '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + id + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
  },

  // Paso 4: Muestra la imagen directamente
  getImageTag: function (url) {
    var cleanUrl = encodeURI(url.trim());
    return '<img src="' + cleanUrl + '" style="max-height: 400px; max-width: 400px;" alt="Imagen compartida">';
  },

  // Paso 5: Sanitiza cadenas escapando caracteres HTML especiales para evitar XSS
  sanitize: function (str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // Paso 5: Método principal validarMensaje
  validarMensaje: function (msg) {
    if (!msg) {
      return JSON.stringify({ nombre: 'Anónimo', mensaje: '', color: '#000000' });
    }

    var isJsonString = false;
    var obj;

    if (typeof msg === 'object') {
      obj = Object.assign({}, msg);
    } else {
      try {
        obj = JSON.parse(msg);
        isJsonString = true;
      } catch (e) {
        obj = { nombre: 'Usuario', mensaje: String(msg), color: '#000000' };
      }
    }

    var contenido = (obj.mensaje !== undefined && obj.mensaje !== null) ? String(obj.mensaje).trim() : '';

    // Sanitizar también el nombre de usuario
    if (obj.nombre) {
      obj.nombre = this.sanitize(String(obj.nombre));
    }

    // 1. Prevención y detección de inyección de scripts
    if (this.is_script_injection(contenido)) {
      obj.mensaje = this.sanitize(contenido);
      obj.sanitized = true;
      obj.is_script = true;
    }
    // 2. Si es imagen válida -> mostrar etiqueta <img>
    else if (this.is_valid_url_image(contenido)) {
      obj.mensaje = this.getImageTag(contenido);
      obj.is_image = true;
    }
    // 3. Si es video válido -> insertar reproductor <iframe>
    else if (this.is_valid_yt_video(contenido)) {
      obj.mensaje = this.getEmbeddedCode(contenido);
      obj.is_video = true;
    }
    // 4. Si es texto normal -> sanitizar contra inyección de scripts
    else {
      obj.mensaje = this.sanitize(contenido);
    }

    return isJsonString ? JSON.stringify(obj) : obj;
  },

  // Alias para mantener compatibilidad
  validateMessage: function (msg) {
    return this.validarMensaje(msg);
  }

};