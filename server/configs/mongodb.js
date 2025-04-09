import mongoose from 'mongoose';

//function to connect mongodb bdd

const connectDB = async () => {
   mongoose.connection.on('connected', () => console.log('Connected'))
   await mongoose.connect('mongodb://localhost:27017/lms')
};


export default connectDB;