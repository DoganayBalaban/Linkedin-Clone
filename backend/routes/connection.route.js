import express from "express";
const router = express.Router();
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnectionRequests,
  getUserConnections,
  removeConnection,
  getConnectionStatus,
} from "../controllers/connection.controller.js";

router.post("/request/:userId", protectRoute, sendConnectionRequest);
router.put("/accept/:userId", protectRoute, acceptConnectionRequest);
router.delete("/reject/:userId", protectRoute, rejectConnectionRequest);
router.get("/requests", protectRoute, getConnectionRequests);
router.get("/", protectRoute, getUserConnections);
router.delete("/:userId", protectRoute, removeConnection);
router.get("/status/:userId", protectRoute, getConnectionStatus);
export default router;
