import { asyncHandler } from "../utils/asyancHandler.js";
import {ApiError} from "../utils/Apierror.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponce.js"

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
 
   
   const {fullName,email,username,password} = req.body
   console.log("email:",email);
   
   if(fullName === "" )
     {
       throw new  ApiError(400,"fullName is required")
     }
     if(email === "" )
     {
       throw new  ApiError(400,"email is required")
     }
     if(username === "" )
     {
       throw new  ApiError(400,"username is required")
     }
     if(password === "" )
     {
       throw new  ApiError(400,"password is required")
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

   if(existingUser){
      throw new ApiError(409,"User with email or username alredy exit")
   }

  const avatarLocalPath =  req.files?.avatar[0]?.path;
  const covarImagePath = req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){

   throw new ApiError(400,"Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(covarImagePath)

  if(!avatar){
   throw new ApiError(400,"Avatar file is required")
  }

  const user = await User.create({
   fullName,
   avatar:avatar.url,
   coverImage:coverImage?.url || "",
   email,
   password,
   username:username.toLowerCase()
  })

  const createdUser = await user.findById(user._id).select(
   "-password -refreshToken"
  )

  if(!createdUser){
   throw new ApiError(500, "somethig went wront registring the user")
  }

  return res.status(201).json(
   new ApiResponse(200,createdUser,"User registered successfully")
  )

});

export {registerUser}