const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

// stores rooms = { room1: 
//                  { users: 
//                      { socketid1: {name: "Steven", choice:1}, 
//                        socketid2: {name2: "Alice", choice:null} 
//                      }, 
//                     gameEnded: false
//                   }
//                 }
const rooms = { safari: { users: {}, gameEnded: false}}

app.get('/', (req, res) => {
  res.render('index', { rooms: rooms })
})

app.post('/room', (req, res) => {
  const roomNum = Math.floor(Math.random() * 10000).toString()
  // if the room already exists, redirect to main page
  // req.body is express middleware, gets the value from the room input form
  if (rooms[req.body.room] != null) {
    return res.redirect('/')
  }
  rooms[roomNum] = { users: {}, gameEnded: false }
  res.redirect(roomNum)
  // Send message that new room was created
  io.emit('room-created', roomNum)
})

app.post('/join', (req, res) => {
  if (rooms[req.body.room] === null) {
    return res.redirect('/')
  }
  res.redirect(req.body.room)
})

app.get('/:room', (req, res) => {
  console.log(rooms[req.params.room])
  // room does not exist
  if (rooms[req.params.room] === undefined) {
    return res.redirect('/')
  }
  else if (Object.keys(rooms[req.params.room].users).length == 2) {
    return res.redirect('/')
  }
  else {
    res.render('room', { roomName: req.params.room })
  }
})

server.listen(5000)

io.on('connection', socket => {
  socket.on('new-user', (room, name) => {
    socket.join(room)
    rooms[room].users[socket.id] = {name: null, choice:null}
    rooms[room].users[socket.id].name = name
    console.log("from connection " + Object.keys(rooms[room].users))
    console.log(Object.keys(rooms[room].users).length)
    socket.to(room).broadcast.emit('user-connected', {name: name, users: Object.keys(rooms[room].users) } )
  })

  socket.on('disconnect', () => {
    getUserRooms(socket).forEach(room => {
      const name = rooms[room].users[socket.id].name
      delete rooms[room].users[socket.id]
      socket.to(room).broadcast.emit('user-disconnected', {name: name, users: Object.keys(rooms[room].users) } )
    })
  })

  socket.on('send-chat-message', (room, message) => {
    socket.to(room).broadcast.emit('chat-message', { message: message, name: rooms[room].users[socket.id].name })
  })

// rock = 0, paper = 1, scissors = 2
// a - b
// -1 B wins
// +1 A wins
// -2 A wins
// +2 B wins
// 0 is a draw

  socket.on('choice', (room, choice) => {
    rooms[room].users[socket.id].choice = choice;
    let currentRoomObj = rooms[room].users
    let players = Object.keys(currentRoomObj)
    console.log("gameEnded: "+ rooms[room].gameEnded)
    if(rooms[room].gameEnded === true){
      io.in(room).emit('chat-message', { message: 'please restart the game', name: 'game'} )
      return 
    }
    if(players.length !== 1) {
      if(currentRoomObj[players[0]].choice === null || currentRoomObj[players[1]].choice === null){
        // send to everyone in room including sender
        io.in(room).emit('chat-message', { message: 'a player has not made a choice', name: 'game'} )
      }
      else {
        const ans = currentRoomObj[players[0]].choice - currentRoomObj[players[1]].choice
        if(ans === 1 || ans === -2){
          io.in(room).emit('chat-message', { message: currentRoomObj[players[0]].name + " has won", name: 'game'} )
        }
        else if (ans === -1 || ans === 2){
          io.in(room).emit('chat-message', { message: currentRoomObj[players[1]].name + " has won", name: 'game'} )
        }
        else {
          io.in(room).emit('chat-message', { message: "it is a draw", name: 'game'} )
        }
        rooms[room].gameEnded = true;
      }
    }
  })

  socket.on('restart', (room) => {
    rooms[room].gameEnded = false;
    for(const socketID in rooms[room].users){
      rooms[room].users[socketID].choice = null;
    }
    io.in(room).emit('chat-message', { message: "game has restarted, please make a choice", name: 'game'} )
  })
})

// how does this work? need to figure out how to disconnect from rooms
function getUserRooms(socket) {
  console.log(Object.entries(rooms))
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}
