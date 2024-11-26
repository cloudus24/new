const mongoose=require("mongoose")

const addressSchema= new mongoose.Schema({
  address:String,
  city:String,
  state:String,
  pincode:String
},
{
    timestamps:true,
    versionKey:false
})

const userSchema= new mongoose.Schema({
  userName:String,
  email:String,
  password:String,
  address:[addressSchema]
},
{
    timestamps:true,
    versionKey:false
})

module.exports= new mongoose.model("user",userSchema)