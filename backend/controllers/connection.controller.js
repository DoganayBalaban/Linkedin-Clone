import { sendConnectionAcceptedEmail } from "../emails/emailHandlers.js";
import ConnectionRequest from "../models/connectionRequest.model.js";
import User from "../models/user.model.js";

export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const sender = req.user._id;
    if (sender.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot send request to yourself" });
    }
    if (req.user.connections.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You are already connected with this user" });
    }
    const existingRequest = await ConnectionRequest.findOne({
      sender,
      recipient: userId,
      status: "pending",
    });
    if (existingRequest) {
      return res.status(400).json({ message: "Request already sent" });
    }
    const newRequest = new ConnectionRequest({
      sender,
      recipient: userId,
    });
    await newRequest.save();
    res.status(201).json({ message: "Request sent successfully" });
  } catch (error) {
    console.error("Error in sendConnectionRequest controller:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const acceptConnectionRequest = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;
  try {
    const request = await ConnectionRequest.findById(requestId)
      .populate("sender", "name email username")
      .populate("recipient", "name username");
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.recipient.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to accept this request" });
    }
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Request has already been accepted/rejected" });
    }
    request.status = "accepted";
    await request.save();
    await User.findByIdAndUpdate(request.sender._id, {
      $addToSet: {
        connections: userId,
      },
    });
    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        connections: request.sender._id,
      },
    });
    const notification = new Notification({
      recipient: request.sender._id,
      type: "connectionAccepted",
      relatedUser: userId,
    });
    await notification.save();
    res.status(200).json({ message: "Connection accepted successfully" });
    const senderEmail = request.sender.email;
    const senderName = request.sender.name;
    const recipientName = request.recipient.name;
    const profileUrl =
      process.env.CLIENT_URL + "/profile/" + request.recipient.username;
    try {
      await sendConnectionAcceptedEmail(
        senderEmail,
        senderName,
        recipientName,
        profileUrl
      );
    } catch (error) {
      console.error("Error in sendConnectionAcceptedEmail:", error);
    }
  } catch (error) {
    console.error("Error in acceptConnectionRequest controller:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const rejectConnectionRequest = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;
  try {
    const request = await ConnectionRequest.findById(requestId);
    if (request.recipient.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to reject this request" });
    }
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Request has already been accepted/rejected" });
    }
    request.status = "rejected";
    await request.save();
    res.status(200).json({ message: "Request rejected successfully" });
  } catch (error) {
    console.error("Error in rejectConnectionRequest controller:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const getConnectionRequests = async (req, res) => {
  const userId = req.user._id;
  try {
    const requests = await ConnectionRequest.find({
      recipient: userId,
      status: "pending",
    }).populate("sender", "name username profilePicture headline connections");
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getConnectionRequests controller:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const getUserConnections = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId).populate(
      "connections",
      "name username profilePicture headline connections"
    );
    res.status(200).json(user.connections);
  } catch (error) {
    console.error("Error in getUserConnections controller:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const removeConnection = async (req, res) => {
  const myId = req.user._id;
  const { userId } = req.params;
  try {
    await User.findByIdAndUpdate(myId, { $pull: { connections: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { connections: myId } });
    res.status(200).json({ message: "Connection removed successfully" });
  } catch (error) {
    console.error("Error in removeConnection controller:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const getConnectionStatus = async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user._id;

  try {
    const currentUser = req.user;
    if (currentUser.connections.includes(targetUserId)) {
      return res.status(200).json({ status: "connected" });
    }
    const pendingRequest = await ConnectionRequest.findOne({
      $or: [
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId },
      ],
      status: "pending",
    });
    if (pendingRequest) {
      if (pendingRequest.sender.toString() === currentUserId.toString()) {
        return res.status(200).json({ status: "pending" });
      } else {
        return res
          .status(200)
          .json({ status: "received", requestId: pendingRequest._id });
      }
    }
    res.status(200).json({ status: "not_connected" });
  } catch (error) {
    console.error("Error in getConnectionStatus controller:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
