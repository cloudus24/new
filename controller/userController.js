const { User } = require(`../model/index.model`);
const bcrypt = require(`bcrypt`);
const jwt = require(`jsonwebtoken`);
const { sendOtpInEmail } = require("../utils/nodeMailer");

exports.emailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Please provide both email and password to login",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Invalid credentials",
        user,
      });
    }
    const data = {
      id: user._id,
      email: user.email,
    };

    const token = jwt.sign(data, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      status: true,
      message: "Email sent successfully",
      token,
    });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({
      status: false,
      message: `Internal Server Error ${error.message}`,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("req.body :>> ", req.body);

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Please provide both email and password to login",
      });
    }

    const user = await User.findOne({ email });
    console.log("user", user);

    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Invalid credentials",
        user,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Invalid credentials",
        user,
      });
    }
    const data = {
      id: user._id,
      name: user.userName,
      email: user.email,
      address: user.address,
    };

    const token = jwt.sign(data, process.env.JWT_SECRET, {
      expiresIn: `1h`,
    });

    return res.status(200).json({
      status: true,
      message: `User logged in successfully`,
      auth_token: token,
      data,
    });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({
      status: false,
      message: `Internal Server Error ${error.message}`,
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      return res.status(401).json({
        status: false,
        message: "Invalid fields",
      });
    }

    console.log(`req.body`, req.body);

    const hash = await bcrypt.hash(password, 10);

    const user = new User();

    user.userName = userName;
    user.email = email;
    user.password = hash;

    await user.save();

    return res.status(201).json({
      status: true,
      message: `user created succesfully`,
      user,
    });
  } catch (error) {
    console.log(error);
    console.log("error :>> ", error);
    return res.status(500).json({ msg: error.message });
  }
};

exports.userGet = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = page * limit;
    const search = req.query.search || ``;

    console.log("search :>> ", search);

    const fieldsToSearch = [`userName`, `email`, `createdAt`];

    const matchQuery = {
      $or: fieldsToSearch.map((field) => ({
        [field]: { $regex: search, $options: `i` },
      })),
    };

    const commonPipeline = [
      {
        $match: matchQuery,
      },
    ];

    const paginationPipeline = [
      ...commonPipeline,
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
    ];

    const countPipeline = [...commonPipeline, { $count: `totalCount` }];

    const totalCountResult = await User.aggregate(countPipeline);
    const totalUsers =
      totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

    const users = await User.aggregate(paginationPipeline);

    return res.status(200).json({
      status: true,
      message: `Users retrieved successfully`,
      users,
      userTotal: totalUsers,
    });
  } catch (error) {
    console.error(`Error fetching users:`, error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.userDelete = async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findByIdAndDelete(userId);

    return res.status(200).json({
      status: true,
      message: `user created succesfully`,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      msg: error.message,
    });
  }
};

exports.userUpdate = async (req, res) => {
  try {
    const { userId } = req.query;

    const { userName, email } = req.body;

    const user = await User.findById(userId);

    user.userName = userName || user.userName;
    user.email = email || user.email;

    await user.save();
    return res.status(200).json({
      status: true,
      message: `user updated successfully`,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      msg: error.message,
    });
  }
};

exports.registerInWeb = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    console.log("req.body", req.body);
    if (!userName || !email || !password) {
      return res.status(401).json({
        status: false,
        message: "Invalid fields",
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    const hash = await bcrypt.hash(password, 10);
    const otpHash = await bcrypt.hash(otp.toString(), 10);
    console.log("otp :>> ", otp);
    const emailSubject = "Your OTP for Registration";
    const emailHtml = `
       <div style="font-family: 'Arial', sans-serif; background-color: #f3f4f7; padding: 40px 0; margin: 0; box-sizing: border-box;">
         <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);">
           <!-- Header Section -->
           <div style="text-align: center; margin-bottom: 30px;">
             <img src="https://via.placeholder.com/150" alt="Logo" style="max-width: 150px; margin-bottom: 20px;" />
             <h2 style="font-size: 28px; color: #2c3e50; margin: 0; font-weight: 700; letter-spacing: -0.5px;">
               Welcome to Your App Name!
             </h2>
             <p style="font-size: 16px; color: #7f8c8d; margin-top: 5px;">Please verify your account by entering the OTP code below.</p>
           </div>
       
           <!-- OTP Section -->
           <div style="text-align: center; margin-bottom: 40px;">
             <p style="font-size: 40px; color: #2980b9; font-weight: bold; margin: 0; letter-spacing: 3px; padding: 15px 30px; background-color: #ecf3fb; border-radius: 8px; display: inline-block;">
               ${otp}
             </p>
             <p style="font-size: 16px; color: #7f8c8d; margin-top: 20px;">Your OTP code will expire in 5 minutes. Please use it promptly to complete the verification process.</p>
           </div>
       
           <!-- Instructions Section -->
           <div style="text-align: center; margin-bottom: 30px;">
             <p style="font-size: 14px; color: #7f8c8d; margin-bottom: 10px;">
               If you did not request this, please ignore this email or contact support.
             </p>
             <p style="font-size: 14px; color: #7f8c8d;">
               For security reasons, this code will expire in 5 minutes from the time of sending.
             </p>
           </div>
       
           <!-- Footer Section -->
           <div style="text-align: center;">
             <p style="font-size: 14px; color: #7f8c8d; margin-top: 20px;">
               Best regards,<br />
               <strong>Your App Name Team</strong>
             </p>
           </div>
       
           <!-- Disclaimer Section -->
           <div style="text-align: center; font-size: 12px; color: #7f8c8d; margin-top: 40px;">
             <p style="margin-bottom: 5px;">This is an automated message. Please do not reply directly to this email.</p>
             <p style="margin-bottom: 0;">For any assistance, contact our <a href="mailto:support@yourapp  .com" style="color: #2980b9; text-decoration: none;">support team</a>.</p>
           </div>
         </div>
       </div>
    `;

    await sendOtpInEmail(email, emailSubject, emailHtml);
    const user = new User({
      userName,
      email,
      
      password: hash,
      otp: otpHash,
    });

    const data = {
      id: user._id,
      email: user.email,
    };

    await user.save();

    return res.status(200).json({
      status: true,
      message: ` User registered successfully. OTP sent to email`,
      data: data.email,
    });
  } catch (error) {
    console.error("Error during registration: ", error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("req.body :>> ", req.body);

    if (!email || !otp) {
      return res
        .status(400)
        .json({ status: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    console.log("user.otp", user.otp);

    if (!user.otp) {
      return res
        .status(400)
        .json({ status: false, message: "OTP not generated or expired" });
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if (!isOtpValid) {
      return res.status(400).json({ status: false, message: "Invalid OTP" });
    }

    if (isOtpValid) {
      user.otp = null;
      user.isEmailVerified = !user.isEmailVerified;
    }

    await user.save();

    const data = {
      id: user._id,
      name: user.userName,
      email: user.email,
      address: user.address,
    };

    const token = jwt.sign(data, process.env.JWT_SECRET);

    return res.status(200).json({
      status: true,
      message: "User logged in successfully",
      auth_token: token,
      data,
    });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.resend_otp = async (req, res) => {
  try {
  } catch (error) {
    console.log("error :>> ", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error !!",
    });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { userId } = req.query;
    const { address, city, state, pincode } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: `User not found` });
    }

    user.address.push({ address, city, state, pincode });

    await user.save();

    const payload = {
      id: user._id,
      name: user.userName,
      email: user.email,
      address: user.address,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `1d`,
    });

    return res
      .status(200)
      .json({ message: `Address added successfully`, token });
  } catch (error) {
    console.log(`error :>> `, error);
    return res.status(500).json({ msg: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.query;

    const { address, city, state, pincode } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: `User not found` });
    }

    const addressToUpdate = user.address.id(addressId);

    if (!addressToUpdate) {
      return res.status(404).json({ msg: `Address not found` });
    }

    addressToUpdate.address = address;
    addressToUpdate.city = city;
    addressToUpdate.state = state;
    addressToUpdate.pincode = pincode;

    await user.save();

    const payload = {
      id: user._id,
      name: user.userName,
      email: user.email,
      address: user.address,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `1d`,
    });

    return res
      .status(200)
      .json({ message: `Address updated successfully`, token });
  } catch (error) {
    console.log(`error :>> `, error);
    return res.status(500).json({ msg: error.message });
  }
};

exports.removeAddress = async (req, res) => {
  try {
    const { userId } = req.query;
    const { addressId } = req.query;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: `User not found` });
    }

    console.log(`object :>>`, user.address.id);
    user.address.id(addressId).deleteOne();

    await user.save();

    const payload = {
      id: user._id,
      name: user.userName,
      email: user.email,
      address: user.address,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `1d`,
    });

    return res
      .status(200)
      .json({ message: `Address removed successfully`, token });
  } catch (error) {
    console.log(`error :>> `, error);
    return res.status(500).json({ msg: error.message });
  }
};
