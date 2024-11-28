// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection (Replace with your MongoDB URI)
mongoose.connect('mongodb://localhost:27017/chatter-up', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Message Schema
const messageSchema = new mongoose.Schema({
    content: String,
    user: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Store active users
let activeUsers = new Map();

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle user join
    socket.on('join', async (username) => {
        console.log('User joining:', username);
        activeUsers.set(socket.id, {
            username,
            id: socket.id
        });

        // Send previous messages
        const messages = await Message.find().sort('-timestamp').limit(50);
        socket.emit('previous-messages', messages);

        // Notify all users about the new user
        io.emit('user-list', Array.from(activeUsers.values()));
        io.emit('user-joined', username);
    });

    // Handle messages
    socket.on('send-message', async (message) => {
        const user = activeUsers.get(socket.id);
        if (user) {
            const newMessage = new Message({
                content: message,
                user: user.username
            });
            await newMessage.save();
            io.emit('new-message', {
                content: message,
                user: user.username,
                timestamp: new Date()
            });
        }
    });

    // Handle typing status
    socket.on('typing', () => {
        const user = activeUsers.get(socket.id);
        if (user) {
            socket.broadcast.emit('user-typing', user.username);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const user = activeUsers.get(socket.id);
        if (user) {
            io.emit('user-left', user.username);
            activeUsers.delete(socket.id);
            io.emit('user-list', Array.from(activeUsers.values()));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});