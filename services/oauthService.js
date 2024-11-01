const oauth2orize = require("oauth2orize");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Client = require("../models/oauthClient.model");

const server = oauth2orize.createServer();

// Xử lý Authorization Code Grant
server.grant(
  oauth2orize.grant.code((client, redirectUri, user, ares, done) => {
    // Kiểm tra client hợp lệ
    Client.findById(client.id, (err, foundClient) => {
      if (err || !foundClient) return done(new Error("Client không hợp lệ"));

      // Kiểm tra redirectUri
      if (foundClient.redirectUris.indexOf(redirectUri) === -1) {
        return done(new Error("Redirect URI không hợp lệ"));
      }

      // Kiểm tra xem người dùng có hợp lệ không
      User.findById(user.id, (err, foundUser) => {
        if (err || !foundUser)
          return done(new Error("Người dùng không hợp lệ"));

        // Tạo mã ủy quyền
        const code = jwt.sign(
          { userId: foundUser.id },
          process.env.JWT_SECRET,
          { expiresIn: "5m" }
        );
        done(null, code);
      });
    });
  })
);

// Xử lý Access Token
server.exchange(
  oauth2orize.exchange.code((client, code, redirectUri, done) => {
    jwt.verify(code, process.env.JWT_SECRET, (err, payload) => {
      if (err) return done(err);

      // Kiểm tra client hợp lệ
      Client.findById(client.id, (err, foundClient) => {
        if (err || !foundClient) return done(new Error("Client không hợp lệ"));

        // Tìm người dùng dựa trên payload
        User.findById(payload.userId, (err, foundUser) => {
          if (err || !foundUser)
            return done(new Error("Người dùng không hợp lệ"));

          // Tạo access token
          const token = jwt.sign(
            { userId: foundUser.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
          );
          done(null, token);
        });
      });
    });
  })
);

module.exports = server;
