import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import config from "./config/config";
import logger from "./config/logger";
import generalMessageController from "./controllers/generalMessage.controller";
import { mongoDbInitValidation } from "./middlewares/initValidation";
import initializeRoutes from "./routes";

const NAMESPACE = "Server";
const app = express();

logger.debug(NAMESPACE, config);

// Initialization
mongoose
  .connect(config.mongo.url, config.mongo.options)
  .then((_) => {
    logger.info(NAMESPACE, "Đã kết nối tới MongoDB ");
  })
  .catch((error) => {
    logger.error(NAMESPACE, "Kết nối tới MongoDB không thành công ", error);
    process.exit(1);
  });

// Logging the request
app.use((req: Request, res: Response, next: NextFunction) => {
  const { method, url } = req;
  logger.request(NAMESPACE, method, url);

  // log when finish request
  res.on("finish", () => {
    logger.response(NAMESPACE, method, url, res.statusCode);
  });
  // log when error appear
  res.on("error", (error) => {
    logger.error(NAMESPACE, `${error.stack}`);
    if (error)
      return res.status(500).send({ message: "Server ngắt kết nối! ", error });
  });
  next();
});

// Parse the request
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  cors({
    allowedHeaders: "*",
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
);
app.use(mongoDbInitValidation);

initializeRoutes(app);

const { port, hostname } = config.server;

// Create the server
const httpServer = http.createServer(app);
httpServer.listen({ port: port, host: "0.0.0.0" }, () =>
  logger.info(NAMESPACE, `Server đang chạy tại đường dẫn ${hostname}:${port}\ `)
);

// Create the socket
export const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "*"],
    credentials: true,
  },
});

let onlineUsers = new Array<string>();
const ioChat = io.of("/messages");

ioChat.on("connection", (socket) => {
  socket.on("online", function (userId: string) {
    if (!onlineUsers.includes(userId)) {
      onlineUsers.push(userId);
    }
    ioChat.emit("update online stack", onlineUsers);
  });

  socket.on("offline", function (userId: string) {
    onlineUsers = onlineUsers.filter((id) => id !== userId);
    ioChat.emit("update online stack", onlineUsers);
  });

  socket.on("get online stack", () => {
    ioChat.emit("update online stack", onlineUsers);
  });

  socket.on("message all", async (msg) => {
    const message = await generalMessageController.pushMessage(msg);
    ioChat.emit("message all", message);
    logger.debug(NAMESPACE, "NEW MESSAGE", message);
  });

  socket.on("update message", async ({ _id, message }) => {
    const newMessage = await generalMessageController.updateMessage({
      _id,
      message,
    });
    ioChat.emit("update message result", {
      message: newMessage,
      updated: Boolean(newMessage),
    });
  });

  socket.on("delete message", async (_id) => {
    const deletedMessage = await generalMessageController.deleteMessage(_id);
    ioChat.emit("delete message result", {
      message: deletedMessage,
      deleted: Boolean(deletedMessage),
    });
  });
});
