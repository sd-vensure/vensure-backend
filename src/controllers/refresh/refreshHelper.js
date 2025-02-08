const knexConnect = require("../../../knexConnection");


const checkRefresh = async (refreshToken) => {

    const userExists = await knexConnect('refresh').where('refresh_token', refreshToken).first();

    if (userExists === undefined) {
        return false
    }
    else {
        return true
    }

}

const saveRefresh = async (user_id, refreshToken, createdAt, expiryAt) => {

    let data = {
        user_id: user_id,
        refresh_token: refreshToken,
        generated_at: createdAt,
        expired_at: expiryAt
    }

    try {
        await knexConnect('refresh').insert(data);
        return true;
    } catch (error) {
        console.log(error)
        return false;
    }

}

const deleteRefresh = async (refreshToken) => {

    let resp = await knexConnect('refresh')
        .where('refresh_token', refreshToken)
        .del();

    // console.log(resp, "this is delete refresh")

    if (resp > 0) {
        return true;
    }
    else {
        return false;
    }
}

module.exports={checkRefresh,deleteRefresh,saveRefresh}