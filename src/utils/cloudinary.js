import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary
        const responce = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",

        })
        //file has been uploaded successfully
        // console.log("file is uploaded on cloudinary", responce.url);
        return responce
        //log responce for study purpose
        // console.log("responce from cloudinary", responce);

    }
    catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        //remove the locally save temp file  as the uplod operation faild
        return null;
    }

}



export { uploadOnCloudinary } 