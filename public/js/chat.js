const socket = io()

// Elements 
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate   = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate   = document.querySelector('#sidebar-template').innerHTML

// Options
const { username , room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {

    //New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage)
    const html = Mustache.render(locationMessageTemplate, {
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('h:mm a'),
        username: locationMessage.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = event.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        
        if(error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', (event) => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)
        socket.emit('sendLocation', {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        }, () => {
            console.log('Location Shared!')
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})