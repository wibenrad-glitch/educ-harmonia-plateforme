import "dotenv/config";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { prisma } from "./lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
    });

    socket.on("send-message", async (data: {
      roomId: string;
      senderId: string;
      content: string;
    }) => {
      const message = await prisma.message.create({
        data: {
          roomId: data.roomId,
          senderId: data.senderId,
          content: data.content,
        },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      });

      io.to(data.roomId).emit("new-message", message);
    });

    socket.on("notification", async (data: {
      userId: string;
      title: string;
      message: string;
    }) => {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
        },
      });
      io.to(`user-${data.userId}`).emit("new-notification", data);
    });

    socket.on("join-user", (userId: string) => {
      socket.join(`user-${userId}`);
    });
  });

  httpServer.listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});
