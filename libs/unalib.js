module.exports = {

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

  is_valid_url_image: function (url) {
    if (!url || typeof url !== 'string') return false;
    var isValid = false;
    var re = /^https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|bmp|webp)(?:\?[^\s<>"']*)?$/i;
    try {
      isValid = re.test(url.trim());
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
  },

  is_valid_yt_video: function (url) {
    if (!url || typeof url !== 'string') return false;
    var isValid = false;
    var re = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})(?:\S*)?$/i;
    try {
      isValid = re.test(url.trim());
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
  },

  is_script_injection: function (str) {
    if (!str || typeof str !== 'string') return false;
    var re = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<[^>]+on\w+\s*=|javascript:/i;
    return re.test(str);
  },

  getYTVideoId: function (url) {
    if (!url || typeof url !== 'string') return '';
    var match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    return match ? match[1] : '';
  },

  getEmbeddedCode: function (url) {
    var id = this.getYTVideoId(url);
    if (!id) return this.sanitize(url);
    return '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + id + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
  },

  getImageTag: function (url) {
    var cleanUrl = encodeURI(url.trim());
    return '<img src="' + cleanUrl + '" style="max-height: 400px; max-width: 400px;" alt="Imagen compartida">';
  },

  sanitize: function (str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

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

    if (obj.nombre) {
      obj.nombre = this.sanitize(String(obj.nombre));
    }

    if (this.is_script_injection(contenido)) {
      obj.mensaje = this.sanitize(contenido);
      obj.sanitized = true;
      obj.is_script = true;
    } else if (this.is_valid_url_image(contenido)) {
      obj.mensaje = this.getImageTag(contenido);
      obj.is_image = true;
    } else if (this.is_valid_yt_video(contenido)) {
      obj.mensaje = this.getEmbeddedCode(contenido);
      obj.is_video = true;
    } else {
      obj.mensaje = this.sanitize(contenido);
    }

    return isJsonString ? JSON.stringify(obj) : obj;
  },

  validateMessage: function (msg) {
    return this.validarMensaje(msg);
  }

};