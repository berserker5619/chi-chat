const socket = io()

//Elements
const $messageForm = document.querySelector('#msg-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#share-location')
const $message = document.querySelector('#message')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll=()=>{
    //New message Element
    const $newMessage=$message.lastElementChild

    //Height of the new message
    const newMessageStyles=getComputedStyle($newMessage)
    const newmessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight+newmessageMargin

    //Visible Height(scroll bar)
    const visibleHeight=$message.offsetHeight

    //height of messages container
    const containerHeight=$message.scrollHeight

    //How far have I scrolled
    const scrollOffset=$message.scrollTop+visibleHeight
    
    if(containerHeight-newMessageHeight <= scrollOffset){
        $message.scrollTop=$message.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('MMM Do YYYY, h:mm a')
    })
    $message.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('MMM Do YYYY, h:mm a')
    })
    $message.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({ room, users }) => {
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
        //acknowledgement
        if (error) {
            return console.log(error);
        }
        console.log('Message Delivered');
    })
})

$sendLocationButton.addEventListener('click', () => {
    $sendLocationButton.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        return window.alert('Geolocation is not supported by your browser')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        socket.emit('sendLocation', { latitude, longitude }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location Shared!');
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        window.alert(error)
        location.href = '/'
    }
})