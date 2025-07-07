import { asyncHandler } from "../utils/asyancHandler.js";
import ApiError from "../utils/Apierror.js"
import User from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponce.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefereshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "something went wront while generating refresh and access token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation - not empty
  //check if user alredy exist: username email
  //check for image, check for avatar
  //uplode them cloudinary, avatar
  //create user object -create entry in db
  //remove password and referesh token field from responce
  //check for user creation user responce 
  //return responce


  const { fullName, email, username, password } = req.body;
  //  console.log("email:",email);

  if (fullName === "") {
    throw new ApiError(400, "fullName is required")
  }
  if (email === "") {
    throw new ApiError(400, "email is required")
  }
  if (username === "") {
    throw new ApiError(400, "username is required")
  }
  if (password === "") {
    throw new ApiError(400, "password is required")
  }


  //   if(
  //    [fullName,email,username,password].some((field)=>
  //    field?.trim() === "")
  //   ){
  //    throw new ApiError(400,"All fields are required")
  //   }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  })

  if (existingUser) {
    throw new ApiError(409, "User with email or username alredy exit")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const covarImagePath = req.files?.coverImage[0]?.path;
  // console.log("avatarLocalPath:",avatarLocalPath); for study purpose
  // console.log("covarImagePath:",covarImagePath); for study purpose
  // console.log("req.files:",req.files); // for study purpose

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }



  if (!avatarLocalPath) {

    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(covarImagePath)

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select("-password -refreshToken");


  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )

});

const loggedInUser = asyncHandler(async (req, res) => {
  //req body -> body
  //username or email
  //find the user
  //check password
  // access token and refresh token
  //send cookies
  const { username, password, email } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or password is required")
  }


  const user = await User.findOne({
    $or: [{ username }, { email }] // find in database
  })

  if (!user) {
    throw new ApiError(404, "user does no exit")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new ApiError(401, "password is incorrect")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshToken(user._id)
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }
  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refereshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200, {
        user: loggedInUser, accessToken,
        refreshToken
      },
        "user logged in successfuly"
      )
    )
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      nrw: true
    }

  )
  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refereshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refereshAccessToken = asyncHandler(async (req, res) => {
  const incomingReferesToken = req.cookies.
    refreshToken || req.body.refreshToken

  if (!incomingReferesToken) {
    throw new ApiError(401, "unauthorized request ")
  }

  try {
    const decodedToken = jwt.verify(
      incomingReferesToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "Invalid referesh Token ")
    }

    if (incomingReferesToken !== user?.refreshToken) {
      throw new ApiError(401, "referesh token is expired or used ")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefereshToken(user._id)
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token referesh successfully"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")

  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {

  const { oldPassword, newPassword } = req.body
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password ")
  }
  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password change successfully"))

})

const getCurentUser = asyncHandler(async (req, res) => {
  return res.status(200)
    .json(200, req.user, "current user fetch successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.bod //when file update aalag controler rakhneka  

  if (!fullName || !email) {
    throw new ApiError(400, "All field required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email
      }
    },
    { new: true }
  ).select("-password")
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path      //multer middleware

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing")
  }

  //!delete old image assinment
  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploding on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    { new: true }
  ).select("-password")
  return res
    .status(200)
    .json(new ApiResponse
      (200, user, " avatar image updated successfully")
    )



})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path      //multer middleware

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploding on coverImage")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    { new: true }
  ).select("-password")
  return res
    .status(200)
    .json(new ApiResponse
      (200, user, "Cover Image updated successfully")
    )



})

const getUserChannelProfile = asyncHandler(async (req, res) => {

  const { username } = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
    //*pipelines and aggregation 
    {
      $match: {
        username: username?.toLowerCase
      }
    },

    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },

    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },

    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },

    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1

      }
    }



  ])

  if (!channel?.length) {
    throw new ApiError(404, "channel doen not exits")
  }
  return res
    .status(200)
    .json(new ApiResponse
      (200, channel[0], "user channel fetch successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
  //string milti hai mingoose use object Id  me convert kar deta hai

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $frist: "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
    .status(200)
    .json(new ApiResponse
      (200,
        user[0].watchHistory,
        "WatchHistory fetch successfully")
    )
})

export {
  registerUser,
  loggedInUser,
  logoutUser,
  refereshAccessToken,
  changeCurrentPassword,
  getCurentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory

};