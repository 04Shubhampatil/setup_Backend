import { asyncHandler } from "../utils/asyancHandler.js";
import ApiError from "../utils/Apierror.js"
import User from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponce.js"
import jwt from "jsonwebtoken"

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

const refereshAccessToken = (async (req, res) => {
  const incomingReferesToken = req.cookies.
    refreshToken || res.body.refreshToken

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



export {
  registerUser,
  loggedInUser,
  logoutUser,
  refereshAccessToken

};