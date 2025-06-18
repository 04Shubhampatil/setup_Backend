import "dotenv/config";
import connectDB from "./db/index.js";
import app from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 5500, () => {
      console.log(`server is running port ${process.env.PORT}`);
    });
  })

  .catch((err) => {
    console.log("MONGONdb Connection faild!!", err);
  });
app.on("error", (error) => {
  console.log("Error:", error);
  throw error;
});



