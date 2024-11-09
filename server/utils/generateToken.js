import jwt from "jsonwebtoken";
import clientDetector from "./clientDetector.js"; 
const generateToken = (req,res, userId) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    const userClient = req.headers["user-agent"] || "";
    const isBrowser= clientDetector(userClient);
    if(isBrowser)
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });
    else
    res.setHeader("Authorization", `Bearer ${token}`);
  } catch (error) {
    console.log(error);
  }
};

export default generateToken;
