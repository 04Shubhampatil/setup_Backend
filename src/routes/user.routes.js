import { Router } from "express";
import {
    changeCurrentPassword,
    getCurentUser,
    getUserChannelProfile,
    getWatchHistory,
    loggedInUser,
    logoutUser,
    refereshAccessToken,
    registerUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
} from "../controllers/user.controller.js";
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

router.route("/change-password").post(verifyJWT,
    changeCurrentPassword)

router.route("/current-user").get(verifyJWT,
    getCurentUser)

router.route("/update-account").patch(verifyJWT,
    updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single
    ("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.
    single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)


export default router

//write a article to accesstoken and referesh token on hash node