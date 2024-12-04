const { User } = require(`../model/index.model`);
const bcrypt = require(`bcrypt`);
const jwt = require(`jsonwebtoken`);
const {sendOtpInEmail} = require("../utils/nodeMailer");

exports.emailVerification =  async(req,res)=>{
  try {
    const {email}=req.body

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
    console.error("error:",error);
    return res.status(500).json({
      status: false,
      message: `Internal Server Error ${error.message}`,
    });
  }
}

exports.login = async (req, res) => {
  try { 
    const { email, password } = req.body; 

    console.log('req.body :>> ', req.body);

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Please provide both email and password to login",
      });
    }

    const user = await User.findOne({ email });
    console.log('user', user)

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
      auth_token :token,
      data
    });
  } catch (error) {
    console.error("error:",error);
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
    console.log('error :>> ', error);
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

    console.log('req.body', req.body)

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

    const otp = Math.floor(100000 + Math.random() * 900000);
    const hash = await bcrypt.hash(password, 10);
    const otpHash = await bcrypt.hash(otp.toString(), 10);


    const emailSubject = "Your OTP for Registration";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Your OTP Code</h2>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>This code will expire in 5 minutes.</p>
        <br>
        <p>Best regards,</p>
        <p>Your App Name Team</p>
      </div>
    `;

    // Send OTP email
    await sendOtpInEmail(email, emailSubject, emailHtml);
    const user = new User({
      userName,
      email,
      password: hash,
      otp:otpHash,
    });

    const data = {
      id: user._id,
      email: user.email,
    };

    await user.save();

    return res.status(200).json({
      status: true,
      message:` User registered successfully. OTP sent to email`,
      data:data.email
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

    console.log('req.body :>> ', req.body);

    if (!email || !otp) {
      return res.status(400).json({ status: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    console.log('user.otp', user.otp)

    // Check if OTP exists and is not null
    if (!user.otp) {
      return res.status(400).json({ status: false, message: 'OTP not generated or expired' });
    }

    // Compare the OTP entered with the hashed OTP in the database
    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if (!isOtpValid) {
      return res.status(400).json({ status: false, message: 'Invalid OTP' });
    }

    user.otp = undefined;  
    user.isVerified = true;
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
      message: 'User logged in successfully',
      auth_token: token,
      data,
    });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    return res.status(500).json({ status: false, message: error.message });
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
   
// {{{{{{{{{{{{((((((<<<<<<<<<<<<<< User Controller End >>>>>>>>>>>>>>}}))))})))}}}}}}}}

exports.j =async(req,res)=>{
  try {
    const {userName,email,password}=req.body

    if (!userName || !email || !password) {
      return res.status(401).json({
        status:false,
        message:"Invalid fields required"
      })
    }

    const hashedPassword = await bcrypt.hash(password,10)

    const user = await User()

    user.userName = userName
    user.email = email 
    user.password = hashedPassword

    await user.save()

    return res.status(200).json({
      status:true,
      message:"User Created Successfully",
      user
    })
  } catch (error) {
    console.log('error', error)
    return res.status(500).json({
      status:false,
      message:"Internal Server Error",
    })
  }
}


exports.m = async(req,res)=>{
  try {
    const page = parseInt(req.query.page) || 0
    const limit = parseInt(req.query.limit) || 10
    const skip = page * limit
    const search = req.query.search || ``

    const fieldsToSearch = [`userName`,`email`,`createdAt`]

    const matchQuery = {
      $or:fieldsToSearch.map((field)=>({
        [field]:{$regex:search,$options:'i'}
      }))
    }

    const commonPipeline = [
      {
        $match:matchQuery
      }
    ]

    const paginationPipeline = [
      ...commonPipeline,
      {$skip:skip},
      {$limit:limit},
      {$sort:{createdAt:-1}}
    ]

    const countPipeline = [
      ...commonPipeline,
      {$count:'totalCount'}
    ]

    const user = await User.aggregate(paginationPipeline)

    const totalUser = await User.aggregate(countPipeline)

    return res.status(200).json({
      status:false,
      message:"User Created Successfully",
      user,
      totalUser
    })
  } catch (error) {
    console.log('error :>> ', error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error"
    })
  }
}

exports.l = async(req,res)=>{
  try {
    const {email,password}=req.body

    if (!email || !password) {
      return res.status(401).json({
        status:false,
        message:"Invalid fields required"
      })
    }

    const hashedPassword = await bcrypt.hash(password,10)

    const user = await User.findOne({email})

    if (!user) {
      return res.status(401).json({
        status:false,
        message:"Invalid credentials"
      })
    }

    const isMatch = await bcrypt.compare(hashedPassword,user.password)

    if (!isMatch) {
      return res.status(401).json({
        status:false,
        message:"Invalid credentials "
      })
    }

    return res.status(200).json({
      status:false,
      message:"User Created Successfully",
      user
    })
  } catch (error) {
    console.log('error :>> ', error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error"
    })
  }
}

exports.f = async(req,res)=>{
  try {
    const {userName ,email ,password}=req.body

    const {userId}=req.query

    if (!userName || !email || !password) {
      return res.status(401).json({
        status:false,
        message:"Invalid fields required"
      })
    }

    if (!userId) {
      return res.status(401).json({
        status:false,
        message:"userId is required"
      })
    }
  } catch (error) {
    console.log('error :>> ', error);
    return res.status(500).json({
       status:false,
       message:"Internal Server Error"
    })
  }
}

exports.jfbb= async(req,res)=>{
  try {
    const {userName ,email ,password}=req.body

    if (!userName || !email || !password) {
      return res.status(401).json({
        status:false,
        message:"Invalid fields required"
      })
    }

    const user = await User()

    user.userName = userName 
    user.email = email 
    user.password = await bcrypt.hash(password,10)

    await user.save()

    const payload = {
      id:user._id,
      email:user.email
    }

    const token = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:`1d`})


    return res.status(200).json({
      status:false,
      message:"User Created Successfully",
      user,
      token
    })
  } catch (error) {
    console.log('error :>> ', error);
    return res.status(5000).json({
      status:false,
      message:"Internal server error !!!"
    })
  }
}

exports.xm = async(req,res)=>{
  try {
    const {email,password}=req.body

    if (!email || !password) {
      return res.status(401).json({
        status:false,
        message:"Invalid fields required"
      })
    }

    const user = await User.findOne({email})

    if (!user) {
      return res.status(401).json({
        status:false,
        message:"Invalid creadentials !!!"
      })
    }

    const isMatch = await bcrypt.compare(password,user.password)

    if (!isMatch) {
      return res.status(401).json({
        status:false,
        message:"Invalid creadentials !!!"
      })
    }

    const payload = {
      id:user._id,
      email:user.email
    }

    return res.status(200).json({
      status:false,
      message:"User Created Successfully",
      user,
      token:jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:`1d`})
    })
  } catch (error) {
    console.log('error :>> ', error);
  }
}