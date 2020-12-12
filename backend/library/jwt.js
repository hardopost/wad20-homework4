const JsonWebToken = require('jsonwebtoken');

const SECRET = '3gJhqIYcMPHE60DoOUkvzLM6WDjOTzE4';

const jwt = {
    createAccessToken: (payload) => {
        return JsonWebToken.sign(payload, SECRET, {
            algorithm: "HS256",
            expiresIn: 600 //10 minutes
        });
    },
    //if successful will return back the payload {id, email, iat, exp}
    verifyAccessToken: (token) => {
        try {
            return JsonWebToken.verify(token, SECRET);
        } catch (err) {
            return false;
        }
    }
};

module.exports = jwt;