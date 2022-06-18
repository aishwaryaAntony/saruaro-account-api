import jwt from "jsonwebtoken";
import db from "../models/index";
import {
    JWT_PRIVATE_KEY
} from "../helpers/constants";
import crypto from "../helpers/crypto"
module.exports = async (req, res, next)=> {
    try {
        const headers = req.headers;
            if (headers.hasOwnProperty('authorization')) {
                const token = req.headers.authorization.split(" ")[1];
                const decoded = jwt.verify(token, JWT_PRIVATE_KEY);
                // To check whether the current user is autorized and correct user
                if(Object.keys(decoded).length > 0){
                    let fetchUser = await db.User.findOne({ where: {id: decoded.user_id }});
                    // console.log('User ==> '+JSON.stringify(fetchUser))
                    if(fetchUser === null){
                        return res.status(200).json({
                            status: 'failed',
                            message: 'Auth failed'
                        });
                    }

                    let hashed_user_id = await crypto.hash_from_string(decoded.user_id);

                    let fetchUserProfile = await db.UserProfile.findOne({
                        where: {
                            hashed_user_id: hashed_user_id,
                            member_token: decoded.member_token
                        }
                    });

                    if(fetchUserProfile === null){
                        return res.status(200).json({
                            status: 'failed',
                            message: 'Auth failed'
                        });
                    }
                    let userObj = {};
                    userObj.user_id = decoded.user_id;
                    userObj.user_profile_id = fetchUserProfile.id;
                    userObj.member_token = decoded.member_token;
                    userObj.login_type = decoded.login_type;
                    req.userData = userObj;
                }else{
                    return res.status(401).json({
                        status: 'failed',
                        message: 'Auth failed'
                    });
                }

                next();   
            }
     
    } catch (error) {
        console.log('Error at middleware '+error)
        return res.status(401).json({
            status: 'failed',
            message: 'Auth failed'
        });
    }    
}