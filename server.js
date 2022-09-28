import app from './app.js'
import http from 'http'
import { Server } from 'socket.io'

const PORT = 3000

const server = http.createServer(app)
const io = new Server(server, {})

server.listen(PORT, () => {
  console.log('server started 3000 port')
})

// WebSocket ursgal neeh
// io.on hvleen awna 
const basket = io.on('connection', (socket) => {
  console.log('a user connected');

  // Tulburiin medeelel huleej avah ursgal
  socket.on('invoice', (paid) => {
    //emiy ilgeene  
    socket.emit('message', 'Connection Started')
  })
})

// tulbur tulugdsun uyd app luu medeelel yvuulah
export const sendPaid = (paid) => {
  if(basket?.connected) {
    console.log('sending to')
    basket.emit('message', paid)
  }
}
