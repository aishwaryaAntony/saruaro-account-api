import db from '../models';

exports.fetch_all_roles =  async (req, res, next) => {
    try{
        let fetch_all_roles = await db.Role.findAll();

        res.status(200).json({
            status: 'success',
            payload: fetch_all_roles,
            message: 'Roles fetched successfully'
        });

    }catch(error){
        console.log("Error at fetch roles ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while Roles",
        }); 
    }
}