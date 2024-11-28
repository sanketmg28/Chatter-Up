import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  socketId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    required: true
  }
});

export const User = mongoose.model('User', userSchema);