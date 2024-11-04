import oauth2orize from "oauth2orize";
import passport from "passport";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import ClientModel from "../models/oauthClient.model.js";

const server = oauth2orize.createServer();

// Xử lý Authorization Code Grant
server.grant(
  oauth2orize.grant.code((client, redirectUri, user, ares, done) => {
    // Kiểm tra client hợp lệ
    ClientModel.findById(client.id, (err, foundClient) => {
      if (err || !foundClient) return done(new Error("Client không hợp lệ"));

      // Kiểm tra redirectUri
      if (foundClient.redirectUris.indexOf(redirectUri) === -1) {
        return done(new Error("Redirect URI không hợp lệ"));
      }

      // Kiểm tra xem người dùng có hợp lệ không
      UserModel.findById(user.id, (err, foundUser) => {
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
        UserModel.findById(payload.userId, (err, foundUser) => {
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

export default server;
