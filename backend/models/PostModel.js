const db = require('../sqlite/connection');

const PostModel = {

    create(params, callback) {
        //statement - andmebaasi postituse sisestamine
        let statement = 'INSERT INTO post (author_id, text, media_type, media_url) VALUES (?, ?, ?, ?);';
        let data = [
            params.userId,
            params.text,
            params.media.type,
            params.media.url
        ];

        return query(statement, data, callback);
    },

    getByIds(ids, userId, callback) {

        const statement = `
        SELECT post.id,
               post.text,
               post.media_type,
               post.media_url,
               post.create_time,
               user.id        AS author_id,
               user.firstname AS author_firstname,
               user.lastname  AS author_lastname,
               user.avatar    AS author_avatar,
               (
                    SELECT COUNT(*)
                    FROM post_like
                    WHERE post_like.post_id = post.id
                      AND post_like.delete_time IS NULL
               ) AS likes,
               (
                    SELECT COUNT(*)
                    FROM post_like
                    WHERE post_like.post_id = post.id
                      AND post_like.user_id = ?
                      AND post_like.delete_time IS NULL
               ) AS liked
        FROM post
                 JOIN user on post.author_id = user.id
        WHERE post.id IN (${ids.map(() => '?').join(',')})
          AND post.delete_time IS NULL
          ORDER BY post.create_time DESC
        `;

        ids.unshift(userId);

        return query(statement, ids, (rows) => {
            let result = [];

            if (Array.isArray(rows)) {
                result = rows.map(row => {
                    let media = null;

                    if (row.media_url && row.media_type) {
                        media = {
                            url: row.media_url,
                            type: row.media_type,
                        }
                    }
                    return {
                        id: row.id,
                        text: row.text,
                        createTime: row.create_time,
                        likes: row.likes,
                        liked: row.liked,
                        media: media,
                        author: {
                            id: row.author_id,
                            firstname: row.author_firstname,
                            lastname: row.author_lastname,
                            avatar: row.author_avatar
                        }
                    };
                })
            }

            callback(result)
        });

    },

    /**
     * Gets all posts for user based on whom they follow or their own posts
     * @param userId
     * @param callback
     */
    getAllForUser(userId, callback) {  //takes userId and callback function as arguments
        //prepared sql statement in variable statement
        const statement = `
            SELECT post.id
            FROM post
            WHERE post.author_id = ?
               OR post.author_id IN (SELECT follow.user_id FROM follow WHERE follow.follower_id = ? AND follow.delete_time IS NULL)
               ORDER BY post.create_time DESC
        `;
        //tagastab andmebaasi päringu tulemuse (rows) ja annab selle funktsioonile argumendiks
        return query(statement, [userId, userId], (rows) => {
            callback(Array.isArray(rows) ? rows.map(row => row.id) : [])
        });

    },

    like(userId, postId, callback) {
        let statement = 'INSERT INTO post_like (user_id, post_id) VALUES (?, ?);';

        return query(statement, [userId, postId], callback);
    },

    unlike(userId, postId, callback) {

        let statement = 'UPDATE post_like SET delete_time = CURRENT_TIMESTAMP WHERE user_id = ? AND post_id = ?;';

        return query(statement, [userId, postId], callback);
    },

    getLikesByUserIdAndPostId(userId, postId, callback) {

        const statement = 'SELECT * FROM post_like WHERE user_id = ? AND post_id = ? AND delete_time IS NULL;';

        return query(statement, [userId, postId], callback);

    }

};

function query(statement, params, callback) {

    return db.all(statement, params, function (err, rows) {

        if (err) throw err;

        callback(rows, this);
    });
}

module.exports = PostModel;