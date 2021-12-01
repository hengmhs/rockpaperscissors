const socket = io('http://localhost:5000')
const messageContainer = document.getElementById('message-container')
const roomContainer = document.getElementById('room-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

const rockBtn = document.getElementById('rock')
const paperBtn = document.getElementById('paper')
const scissorsBtn = document.getElementById('scissors')
const restartBtn = document.getElementById('restart')

// messageContainer != null because this script is shared with the index.ejs and room.ejs
// index.ejs doesn't have a messageContainer field and hence this code won't run
if (messageContainer != null) {
  const name = prompt('What is your name?')
  appendMessage('You joined')
  socket.emit('new-user', roomName, name)

  rockBtn.addEventListener('click', ()=>{
    appendMessage(`You have chosen rock`)
    socket.emit('send-chat-message', roomName, `${name} has chosen rock`)
    socket.emit('choice', roomName, 0)
  })

  paperBtn.addEventListener('click', ()=>{
    appendMessage(`You have chosen paper`)
    socket.emit('send-chat-message', roomName, `${name} has chosen paper`)
    socket.emit('choice', roomName, 1)
  })

  scissorsBtn.addEventListener('click', ()=>{
    appendMessage(`You have chosen scissors`)
    socket.emit('send-chat-message', roomName, `${name} has chosen scissors`)
    socket.emit('choice', roomName, 2)
  })

  restartBtn.addEventListener('click', ()=>{
    appendMessage(`Game restarted`)
    socket.emit('send-chat-message', roomName, `${name} has restarted the game`)
    socket.emit('restart', roomName)
  })
}

socket.on('room-created', room => {
  const roomElement = document.createElement('div')
  roomElement.innerText = room
  const roomLink = document.createElement('a')
  roomLink.href = `/${room}`
  roomLink.innerText = 'join'
  roomContainer.append(roomElement)
  roomContainer.append(roomLink)
})

socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
})

socket.on('user-connected', name => {
  appendMessage(`${name} connected`)
})

socket.on('user-disconnected', name => {
  appendMessage(`${name} disconnected`)
})

function appendMessage(message) {
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  messageContainer.append(messageElement)
}