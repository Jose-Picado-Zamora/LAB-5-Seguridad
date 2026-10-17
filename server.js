// Servidor UNA Chat
var validation = require('./libs/unalib');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta raíz: presentar HTML
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Endpoint HTTP para validación de mensajes (usado en pruebas de integración)
app.post('/api/mensaje', function(req, res){
  var rawMsg = req.body;
  if (!rawMsg) {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  var validado = validation.validarMensaje(rawMsg);
  var resultado = (typeof validado === 'string') ? JSON.parse(validado) : validado;

  return res.status(200).json({
    status: resultado.is_script ? 'sanitized' : 'success',
    mensaje: resultado.mensaje,
    sanitized: !!resultado.sanitized,
    is_image: !!resultado.is_image,
    is_video: !!resultado.is_video
  });
});

// Escuchar una conexión por socket
io.on('connection', function(socket){
  socket.on('Evento-Mensaje-Server', function(msg){
    // Llama al método validarMensaje de una-lib
    var procesado = validation.validarMensaje(msg);
    var payload = (typeof procesado === 'string') ? procesado : JSON.stringify(procesado);
    // Volvemos a emitir el mensaje validado/saneado
    io.emit('Evento-Mensaje-Server', payload);
  });
});

if (require.main === module) {
  http.listen(port, function(){
    console.log('Servidor UNA Chat escuchando en *:' + port);
  });
}

module.exports = { app, http, io };
