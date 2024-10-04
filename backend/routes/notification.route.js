import express from "express";
const router = express.Router();
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

router.get("/", protectRoute, getUserNotifications);
router.put("/:id/read", protectRoute, markNotificationAsRead);
router.delete("/:id", protectRoute, deleteNotification);

export default router;
