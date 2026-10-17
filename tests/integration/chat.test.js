const request = require('supertest');
const { app, http, io } = require('../../server');
const ioClient = require('socket.io-client');

describe('Pruebas de Integración - UNA Chat (Backend + una-lib)', () => {
  let serverInstance;
  let serverPort;
  let clientSocket;

  beforeAll((done) => {
    serverInstance = http.listen(0, () => {
      serverPort = serverInstance.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    try {
      io.close(() => {
        done();
      });
    } catch (e) {
      done();
    }
  });

  describe('Pruebas HTTP con Supertest', () => {
    it('GET / debe entregar la interfaz HTML con status 200', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.type).toContain('html');
    });

    it('POST /api/mensaje con URL de imagen válida: backend acepta y genera etiqueta <img>', async () => {
      const payload = {
        nombre: 'Jose',
        mensaje: 'https://ejemplo.com/foto.png',
        color: '#00ff00'
      };

      const response = await request(app)
        .post('/api/mensaje')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.is_image).toBe(true);
      expect(response.body.mensaje).toContain('<img');
      expect(response.body.mensaje).toContain('src="https://ejemplo.com/foto.png"');
    });

    it('POST /api/mensaje con URL de video válida: backend acepta y genera reproductor <iframe>', async () => {
      const payload = {
        nombre: 'Jose',
        mensaje: 'https://www.youtube.com/watch?v=qYwlqx-JLok',
        color: '#00ff00'
      };

      const response = await request(app)
        .post('/api/mensaje')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.is_video).toBe(true);
      expect(response.body.mensaje).toContain('<iframe');
      expect(response.body.mensaje).toContain('https://www.youtube.com/embed/qYwlqx-JLok');
    });

    it('POST /api/mensaje con script malicioso: validación detecta y devuelve contenido saneado', async () => {
      const payload = {
        nombre: 'Atacante',
        mensaje: "<script>alert('Inyección de script');</script>",
        color: '#ff0000'
      };

      const response = await request(app)
        .post('/api/mensaje')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.sanitized).toBe(true);
      expect(response.body.mensaje).not.toContain('<script>');
      expect(response.body.mensaje).toContain('&lt;script&gt;');
    });
  });

  describe('Pruebas de Eventos Socket.IO', () => {
    beforeEach((done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        forceNew: true
      });
      clientSocket.on('connect', done);
    });

    afterEach(() => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
      }
    });

    it('debe recibir el evento y sanitizar un script malicioso en tiempo real', (done) => {
      const mensajeMalicioso = {
        nombre: 'Hacker',
        mensaje: "<script>alert('xss');</script>",
        color: '#ff0000'
      };

      clientSocket.on('Evento-Mensaje-Server', (data) => {
        const respuesta = (typeof data === 'string') ? JSON.parse(data) : data;
        expect(respuesta.mensaje).not.toContain('<script>');
        expect(respuesta.mensaje).toContain('&lt;script&gt;');
        expect(respuesta.sanitized).toBe(true);
        done();
      });

      clientSocket.emit('Evento-Mensaje-Server', JSON.stringify(mensajeMalicioso));
    });

    it('debe procesar una imagen y emitir el tag <img> a través de Socket.IO', (done) => {
      const mensajeImagen = {
        nombre: 'Jose',
        mensaje: 'https://ejemplo.com/avatar.jpg',
        color: '#0000ff'
      };

      clientSocket.on('Evento-Mensaje-Server', (data) => {
        const respuesta = (typeof data === 'string') ? JSON.parse(data) : data;
        expect(respuesta.mensaje).toContain('<img');
        expect(respuesta.mensaje).toContain('src="https://ejemplo.com/avatar.jpg"');
        done();
      });

      clientSocket.emit('Evento-Mensaje-Server', JSON.stringify(mensajeImagen));
    });
  });

});
