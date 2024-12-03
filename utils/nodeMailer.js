exports.sendOtpInEmail = async () => {
  try {
  } catch (error) {
    console.log("error :>> ", error);
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};
