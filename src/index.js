import "dotenv/config";
import connectDB from "./db/index.js";
import express from "express";
const app = express();

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running port ${process.env.PORT}`);
    });
  })

  .catch((err) => {
    console.log("MONGONdb Connection faild!!", err);
  });
app.on("erroe", (error) => {
  console.log("Error:", error);
  throw error;
});
