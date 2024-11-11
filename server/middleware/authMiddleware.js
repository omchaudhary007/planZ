import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import clientDetector from "../utils/clientDetector.js";

export const checkRole = (roles) => {
  return async (req, res, next) => {
    let token;
    const userClient = req.headers["user-agent"] || "";
    const isBrowser = clientDetector(userClient);
    if (isBrowser) token = req.cookies.jwt;
    else token = (req.headers?.authorization)? req.headers.authorization.split(" ")[1] :undefined; // bearer token
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findOne({ _id: decoded.userId }).select(
          "role"
        );
        const adminRole = admin ? admin.role : null;
        if (admin && roles.includes(adminRole)) {
          next();
        } else {
          return res.status(401).send("Forbidden");
        }
      } catch (error) {
        return res.status(401).send("Not Authorized");
      }
    } else {
      return res.status(401).send("Not Authorized, No Token");
    }
  };
};
