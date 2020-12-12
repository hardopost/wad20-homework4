const db = require('../sqlite/connection');
const pwd = require('../library/password');

const UserModel = {

    create(params, callback) {
        let salt = pwd.generateSalt();
        let password = pwd.hashPassword(params.password, salt);
        let statement = 'INSERT INTO user (firstname, lastname, email, avatar, password, salt) VALUES (?, ?, ?, ?, ?, ?);';
        let data = [
            params.firstname,
            params.lastname,
            params.email,
            params.avatar,
            password,
            salt,
        ];

        return query(statement, data, callback);
    },

    getById(id, callback) {

        const statement = 'SELECT * FROM user WHERE id = ? AND delete_time IS NULL';

        return query(statement, [id], (rows) => {
            let user = null;

            if (Array.isArray(rows) && rows.length) {
                user = {
                    id: rows[0].id,
                    firstname: rows[0].firstname,
                    lastname: rows[0].lastname,
                    email: rows[0].email,
                    avatar: rows[0].avatar
                };
            }

            callback(user)
        });

    },


    getByEmailAndPassword(email, password, callback) {
        //getByEmail is invoked and as a result we get user object for passing to function below..
        return this.getByEmail(email, (user) => {
            /*if user is not null we take user entered password and user.salt that was stored in DB and we calculate
            hashed password and save it in variable hash.
            then we compare if the newly calculated hash equals the hash that was stored in DB.
            If it is we have found our user if not we set the user variable null.
             */
            if (user) {
                let hash = pwd.hashPassword(password, user.salt);

                if (hash !== user.password) {
                    user = null;
                }
            }
            /* we give out user (can be null or real user object) to callback(user) function that was
            invoked from users page
             */
            callback(user)
        });
    },

    //takes e-mail and uses it for DB query to find user
    getByEmail(email, callback) {
        //prepared statement
        const statement = 'SELECT * FROM user WHERE email = ? AND delete_time IS NULL';

        //actual database query takes place here
        return query(statement, [email], (rows) => {
            let user = null;

            /*if we got user object from database we have it on rows[0] and we save it to user variable
            * if we didn't get user from database user variable remains null*/
            if (Array.isArray(rows) && rows.length) {
                user = rows[0];
            }

            /*we give user to callback(user) as argument? the function will be executed above in "parent" function
            getByEmailAndPassword, but from here it gets the user that was retrieved from DB */
            callback(user)
        });

    },

    getAll(userId, callback) {

        const statement = `
        SELECT 
            user.id,
            user.firstname,
            user.lastname,
            user.avatar,
            user.email,
            (
                SELECT COUNT(*)
                FROM follow
                WHERE follow.user_id = user.id
                  AND follow.follower_id = ?
                  AND follow.delete_time IS NULL
            ) AS followed
        FROM user
        WHERE user.id != ?
            AND user.delete_time IS NULL
        `;
        return query(statement, [userId, userId], (rows) => {
            if (Array.isArray(rows)) {
                callback(
                    rows.map(user => {
                            user.followed = user.followed !== 0;
                            return user;
                        }
                    )
                );
                return;
            }
            callback([])
        });

    },


};

function query(statement, params, callback) {

    return db.all(statement, params, function (err, rows) {

        if (err) throw err;

        callback(rows, this);
    });
}

module.exports = UserModel;