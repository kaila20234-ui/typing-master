import express from 'express';
import Invitation from '../models/Invitation.js';
import User from '../models/User.js';

const router = express.Router();

// Get pending invitations for user
router.get('/pending', async (req, res) => {
  try {
    const invitations = await Invitation.find({
      to: req.userId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('from', 'username profilePicture name')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send invitation (race or friend request)
router.post('/send', async (req, res) => {
  try {
    const { toUserId, type, raceId, message } = req.body;

    if (!toUserId || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if receiver exists
    const receivingUser = await User.findById(toUserId);
    if (!receivingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const invitation = new Invitation({
      from: req.userId,
      to: toUserId,
      type,
      raceId,
      message,
    });

    await invitation.save();

    res.status(201).json(invitation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept invitation
router.post('/:invitationId/accept', async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.invitationId);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.to.toString() !== req.userId) {
      return res.status(403).json({ error: 'Cannot accept invitation for other users' });
    }

    if (invitation.type === 'friend_request') {
      // Add to friends list
      await User.findByIdAndUpdate(req.userId, {
        $addToSet: { friends: invitation.from },
      });

      await User.findByIdAndUpdate(invitation.from, {
        $addToSet: { friends: req.userId },
      });
    }

    invitation.status = 'accepted';
    await invitation.save();

    res.json(invitation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decline invitation
router.post('/:invitationId/decline', async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.invitationId);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.to.toString() !== req.userId) {
      return res.status(403).json({ error: 'Cannot decline invitation for other users' });
    }

    invitation.status = 'declined';
    await invitation.save();

    res.json(invitation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
