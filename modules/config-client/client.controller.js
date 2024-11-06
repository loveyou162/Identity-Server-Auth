import crypto from "crypto";
import Client from "../../models/oauthClient.model.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { deleteOne } from "../../handlers/factor.js";


// Hàm tạo chuỗi ngẫu nhiên
const generateRandomString = (length) =>
  crypto.randomBytes(length).toString("hex");

// Đăng ký client
const registerClient = async (req, res) => {
  const { name, redirectUri, scope, grantTypes } = req.body;
  console.log({ name, redirectUri, scope, grantTypes });
  const clientId = generateRandomString(16); // 32 ký tự hex
  const clientSecret = generateRandomString(32); // 64 ký tự hex

  const client = new Client({
    name,
    clientId,
    clientSecret,
    redirectUri,
    grantTypes,
    scope,
  });
  await client.save();

  res.json({ clientId, clientSecret, redirectUri });
};

const getAll = async (req, res) => {
  try {
    const configs = await Client.find();
    res.status(200).json({ status: 'success', data: configs });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateConfigClient = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const updateConfigClient = await Client.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  updateConfigClient && res.status(201).json({ message: "success", updateConfigClient });

  !updateConfigClient && next(new AppError("Client was not found", 404));
});
const deleteConfigClient = deleteOne(Client, "OAuthClient");
const getIdConfig = async (req, res) => {
  try {
    const { id } = req.params; 
    const config = await OauthConfig.findOne({ id });

    if (!config) {
      return res.status(404).json({ status: 'error', message: 'client not found' });
    }

    res.status(200).json({ status: 'success', data: config });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
export {
   registerClient  ,
   getAll ,
    updateConfigClient,
    deleteConfigClient,
    getIdConfig,
};
