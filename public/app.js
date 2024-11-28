// public/app.js
document.addEventListener('DOMContentLoaded', () => {
    // Connect to Socket.io server
    const socket = io();

    // DOM Elements
    const loginContainer = document.getElementById('loginContainer');
    const chatContainer = document.getElementById('chatContainer');
    const loginForm = document.getElementById('loginForm');
    const messageForm = document.getElementById('messageForm');
    const messagesContainer = document.getElementById('messagesContainer');
    const usersList = document.getElementById('usersList');
    const currentUser = document.getElementById('currentUser');
    const onlineCount = document.getElementById('onlineCount');
    const typingIndicator = document.getElementById('typingIndicator');
    const messageInput = document.getElementById('messageInput');

    let username = '';
    let typingTimeout = null;

    // Login Form Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        username = document.getElementById('usernameInput').value.trim();
        
        if (username) {
            // Emit join event
            socket.emit('join', username);
            
            // Update UI
            loginContainer.classList.add('hide');
            chatContainer.classList.remove('hide');
            currentUser.textContent = username;
            
            // Focus on message input
            messageInput.focus();
        }
    });

    // Message Form Submit
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        
        if (message) {
            socket.emit('send-message', message);
            messageInput.value = '';
            
            // Add message to UI immediately for sender
            addMessage({
                content: message,
                user: username,
                timestamp: new Date()
            }, true);
        }
    });

    // Typing Indicator
    messageInput.addEventListener('input', () => {
        socket.emit('typing');
        
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        
        typingTimeout = setTimeout(() => {
            typingIndicator.classList.add('hide');
        }, 1000);
    });

    // Socket Event Handlers
    socket.on('previous-messages', (messages) => {
        messages.forEach(msg => addMessage(msg));
        scrollToBottom();
    });

    socket.on('new-message', (message) => {
        if (message.user !== username) {
            addMessage(message);
            scrollToBottom();
        }
    });

    socket.on('user-list', (users) => {
        updateUsersList(users);
        updateOnlineCount(users.length);
    });

    socket.on('user-joined', (user) => {
        addSystemMessage(`${user} joined the chat`);
    });

    socket.on('user-left', (user) => {
        addSystemMessage(`${user} left the chat`);
    });

    socket.on('user-typing', (user) => {
        if (user !== username) {
            typingIndicator.textContent = `${user} is typing...`;
            typingIndicator.classList.remove('hide');
            
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
            
            typingTimeout = setTimeout(() => {
                typingIndicator.classList.add('hide');
            }, 1000);
        }
    });

    // Helper Functions
    function addMessage(message, isSent = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        
        messageDiv.innerHTML = `
            <div class="message-info">
                ${message.user} - ${new Date(message.timestamp).toLocaleTimeString()}
            </div>
            <div class="message-content">
                ${message.content}
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
    }

    function addSystemMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function updateUsersList(users) {
        usersList.innerHTML = users.map(user => `
            <div class="user-item">
                <span class="user-status"></span>
                <span>${user.username}</span>
            </div>
        `).join('');
    }

    function updateOnlineCount(count) {
        onlineCount.textContent = `${count} user${count !== 1 ? 's' : ''} online`;
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});