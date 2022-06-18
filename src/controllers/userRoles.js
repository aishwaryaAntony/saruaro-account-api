import db from '../models';

exports.user_roles =  async (req, res, next) => {
    try{
        let fetch_all_roles = await db.UserRole.findAll();

        res.status(200).json({
            status: 'success',
            payload: fetch_all_roles,
            message: 'User Roles fetched successfully'
        });

    }catch(error){
        console.log("Error at fetch user roles ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while User Roles",
        }); 
    }
}