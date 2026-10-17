var val = require('../libs/unalib');
var assert = require('assert');

describe('unalib - Pruebas Unitarias (Lab 5)', function () {

  // 1. Pruebas existentes: Validación de teléfono
  describe('Función is_valid_phone', function () {
    it('debería devolver true para 8297-8547', function () {
      assert.strictEqual(val.is_valid_phone('8297-8547'), true);
    });

    it('debería devolver false para 8297p-8547', function () {
      assert.strictEqual(val.is_valid_phone('8297p-8547'), false);
    });
  });

  // 2. Paso 7: Validación de URLs de Imágenes
  describe('Validación de URLs de Imágenes', function () {
    it('debería devolver true para http://image.com/image.jpg', function () {
      assert.strictEqual(val.is_valid_url_image('http://image.com/image.jpg'), true);
    });

    it('debería devolver true para http://image.com/image.gif', function () {
      assert.strictEqual(val.is_valid_url_image('http://image.com/image.gif'), true);
    });

    it('debería devolver true para https://ejemplo.com/foto.png', function () {
      assert.strictEqual(val.is_valid_url_image('https://ejemplo.com/foto.png'), true);
    });

    it('debería devolver false para un archivo que no sea imagen (ej. documento.pdf)', function () {
      assert.strictEqual(val.is_valid_url_image('https://ejemplo.com/documento.pdf'), false);
    });

    it('debería generar la etiqueta <img> correcta mediante getImageTag', function () {
      var tag = val.getImageTag('https://ejemplo.com/foto.png');
      assert.ok(tag.includes('<img'));
      assert.ok(tag.includes('src="https://ejemplo.com/foto.png"'));
    });
  });

  // 3. Paso 7: Validación de URLs de Videos
  describe('Validación de URLs de Videos', function () {
    it('debería devolver true para URL estándar https://www.youtube.com/watch?v=qYwlqx-JLok', function () {
      assert.strictEqual(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);
    });

    it('debería devolver true para URL acortada https://youtu.be/qYwlqx-JLok', function () {
      assert.strictEqual(val.is_valid_yt_video('https://youtu.be/qYwlqx-JLok'), true);
    });

    it('debería devolver false para una URL que no es de YouTube', function () {
      assert.strictEqual(val.is_valid_yt_video('https://vimeo.com/12345678'), false);
    });

    it('debería extraer correctamente el ID del video con getYTVideoId', function () {
      var id = val.getYTVideoId('https://www.youtube.com/watch?v=qYwlqx-JLok');
      assert.strictEqual(id, 'qYwlqx-JLok');
    });

    it('debería generar el reproductor <iframe> con getEmbeddedCode', function () {
      var embed = val.getEmbeddedCode('https://www.youtube.com/watch?v=qYwlqx-JLok');
      assert.ok(embed.includes('<iframe'));
      assert.ok(embed.includes('https://www.youtube.com/embed/qYwlqx-JLok'));
    });
  });

  // 4. Paso 7: Prevención de Inyección de Scripts (XSS)
  describe('Prevención de Inyección de Scripts', function () {
    it('debería detectar scripts maliciosos con <script>alert()</script>', function () {
      var script = "<script>alert('Inyección de script');</script>";
      assert.strictEqual(val.is_script_injection(script), true);
    });

    it('debería detectar eventos maliciosos inline como <img onerror=alert(1)>', function () {
      var payload = "<img src=x onerror=alert('xss')>";
      assert.strictEqual(val.is_script_injection(payload), true);
    });

    it('debería devolver false para mensajes de texto normales', function () {
      assert.strictEqual(val.is_script_injection('Hola a todos en el chat'), false);
    });

    it('debería sanear caracteres especiales con sanitize()', function () {
      var sucio = "<script>alert('xss')</script>";
      var limpio = val.sanitize(sucio);
      assert.strictEqual(limpio.includes('<script>'), false);
      assert.ok(limpio.includes('&lt;script&gt;'));
    });

    it('validarMensaje debería neutralizar script injection y devolver contenido saneado', function () {
      var payload = JSON.stringify({
        nombre: 'Atacante',
        mensaje: "<script>alert('Inyección de script');</script>",
        color: '#ff0000'
      });
      var resultado = JSON.parse(val.validarMensaje(payload));
      assert.strictEqual(resultado.mensaje.includes('<script>'), false);
      assert.ok(resultado.mensaje.includes('&lt;script&gt;'));
      assert.strictEqual(resultado.sanitized, true);
    });
  });

});
