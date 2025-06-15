import mongoose from "mongoose";
const connectDB = async () => {
  try {
    const connectionInstence = await mongoose.connect(process.env.MONDODB_URL);
    console.log(`\n MongoDB connected !! DB Host: ${connectionInstence.connection.host}`);
    // console.log(connectionInstence);
    
  } catch (error) {
    console.error("Mongo DB connection Faild", error);
    process.exit(1);
  }
};

export default connectDB;