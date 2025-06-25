import { Router } from "express";
import { loggedInUser, logoutUser, refereshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js"



const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

    router.route("/login").post(loggedInUser)

    //secure route
    router.route("/logout").post(verifyJWT, logoutUser)
    router.route("/refresh-token").post(refereshAccessToken)
    
export default router