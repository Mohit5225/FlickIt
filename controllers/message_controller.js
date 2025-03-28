import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";

export const sendMessage = async (req, res) => {
    try {
        const senderID = req.id;
        const receiverID = req.params.id;
        const { message } = req.body;

        let conversation = await Conversation.findOne({ participantID: { senderID, receiverID } });

        if (!conversation) {
            conversation = new Conversation({
                participantID: { senderID, receiverID },
                messages: [{ senderID, receiverID, message }]
            });
        }

        const newMessage = await Message.create({
            senderID,
            receiverID,
            message
        });

        if (newMessage) conversation.messages.push(newMessage._id);
        await Promise.all([conversation.save(), newMessage.save()]);

        return res.status(201).json({
            message: "Message sent successfully",
            success: true,
            data: newMessage
        });
    } catch (error) {
        console.log(`Conversation received:`, error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

export const getMessage = async (req, res) => {
    try {
        const senderID = req.id;
        const receiverID = req.params.id;
        const conversation = await Conversation.findOne({ participantID: { senderID, receiverID } });
        if (!conversation) return res.status(200).json({ success: false, message: [] });

        return res.status(200).json({ success: true, message: conversation.messages });
    } catch (error) {
        console.log(`Error retrieving messages:`, error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
