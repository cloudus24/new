const express = require("express")
const route = express.Router()
const userController = require("../controller/userController")
const {checkAccess} = require("../utils/checkAccessKey")

const key = require("../utils/checkAccessKey")
const { authenticateToken } = require("../middlewere/adminAuth")

route.get("/show" ,checkAccess, userController.userGet)

// route.post("/create", checkAccess,userController.register)
route.post("/create",checkAccess, userController.registerInWeb)
route.delete("/delete", checkAccess,userController.userDelete)
route.patch("/update", checkAccess,userController.userUpdate)
route.post("/login",checkAccess, userController.login)
route.post("/addAddress", checkAccess,userController.addAddress)
route.put("/updateAddress", checkAccess,userController.updateAddress)
route.delete("/deleteAddress", checkAccess,userController.removeAddress)

module.exports = route