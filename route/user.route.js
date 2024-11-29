const express = require("express")
const route = express.Router()
const userController = require("../controller/userController")
const {checkAccess} = require("../utils/checkAccessKey")

const key = require("../utils/checkAccessKey")
const { authenticateToken } = require("../middlewere/adminAuth")

route.get("/show" , userController.userGet)

route.post("/create", userController.register)
route.post("/registerInWeb", userController.registerInWeb)
route.delete("/delete", userController.userDelete)
route.patch("/update", userController.userUpdate)
route.post("/login",checkAccess, userController.login)
route.post("/addAddress", userController.addAddress)
route.put("/updateAddress", userController.updateAddress)
route.delete("/deleteAddress", userController.removeAddress)

module.exports = route