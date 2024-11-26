exports.response=async(res,status,data)=>{
    return res.status(status).json(data)
    
}