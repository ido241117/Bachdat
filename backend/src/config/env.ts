import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 8787,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/quickbite",
  jwtSecret: process.env.JWT_SECRET || "mealnow-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  devOtp: process.env.DEV_OTP || "123456",
};
