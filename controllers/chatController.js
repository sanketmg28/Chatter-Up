import Message from '../models/Message.js';
import User from '../models/User.js';

// Get chat history
export const getChatHistory = async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve chat history' });
    }
};

// Save a new message
export const saveMessage = async (data) => {
    try {
        const newMessage = new Message(data);
        await newMessage.save();
    } catch (error) {
        console.error('Failed to save message:', error);
    }
};

// Handle user connection
export const userConnected = async (name) => {
    try {
        let user = await User.findOne({ name });
        if (!user) {
            user = new User({ name });
        }
        user.isOnline = true;
        await user.save();
        return user;
    } catch (error) {
        console.error('Failed to handle user connection:', error);
    }
};

// Handle user disconnection
export const userDisconnected = async (name) => {
    try {
        await User.findOneAndUpdate({ name }, { isOnline: false });
    } catch (error) {
        console.error('Failed to handle user disconnection:', error);
    }
};

// Get online users
export const getOnlineUsers = async (req, res) => {
    try {
        const users = await User.find({ isOnline: true });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve online users' });
    }
};
