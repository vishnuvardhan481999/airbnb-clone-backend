import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log(`Connected to MongoDb Database ${mongoose.connection.host}.`);
    return;
  } catch (err) {
    console.log(`MongoDb Database Error ${err}.`);
    process.exit(1);
  }
};

export default connectDB;
