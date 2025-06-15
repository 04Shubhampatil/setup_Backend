
 const asyncHandler = (requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
 }


//^ const  asyncHandler=()={}
//^ const  asyncHandler=(fun)= ()=>{}
//^ const  asyncHandler=(fun)= async()=>{}


// const asyncHandler = (fn) => (req, res, next) {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message:err.message
//         })
        
//     }
// }