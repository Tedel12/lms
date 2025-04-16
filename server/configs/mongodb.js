import mongoose from 'mongoose';

//function to connect mongodb bdd

const connectDB = async () => {
   mongoose.connection.on('connected', () => console.log('Connected'))
   await mongoose.connect(`${process.env.MONGODB_URI}/lms`)
};


export default connectDB;