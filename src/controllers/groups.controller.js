// src/controllers/groups.controller.js (UPDATED)
import { Group } from '../models/Groups.js';
import { User } from '../models/Users.js';
import Career from '../models/Career.js';
import { createTelegramGroup } from '../services/telegram.js';

// @desc    Find or create a study group for a specific subject
// @route   POST /api/groups/find-or-create
// @access  Private (requires JWT auth)
const findOrCreateGroup = async (req, res) => {
  const { subjectName } = req.body;
  const currentUser = req.user;

  if (!subjectName) {
    return res.status(400).json({ message: 'Subject name is required.' });
  }

  if (!currentUser.career || !currentUser.currentSemesterNumber) {
      return res.status(400).json({ message: 'User profile incomplete. Please set your career and current semester first.' });
  }

  try {
    // 1. Search for existing, joinable groups
    let existingGroups = await Group.find({
      career: currentUser.career,
      subjectName: subjectName,
      members: { $ne: currentUser._id } // User not already a member
    })
    .populate('members', 'username first_name last_name')
    .sort({ createdAt: -1 })
    .lean();

    const MAX_GROUP_SIZE = 5;
    existingGroups = existingGroups.filter(group => group.members.length < MAX_GROUP_SIZE);

    if (existingGroups.length > 0) {
      // Found existing groups, return them
      return res.status(200).json({
        message: `Found ${existingGroups.length} existing groups for "${subjectName}".`,
        groups: existingGroups.map(group => ({
          ...group,
          telegramInviteLink: group.telegramInviteLink
        })),
        action: 'found'
      });
    }

    // 2. No suitable groups found, automatically create a new one
    console.log(`No existing groups for "${subjectName}" in ${currentUser.career}. Creating a new one...`);

    const careerObj = await Career.findById(currentUser.career);
    const careerName = careerObj ? careerObj.name : 'Unknown Career';

    const groupName = `Grupo de Estudio: ${subjectName} (${careerName})`;
    const newGroup = new Group({
      name: groupName,
      career: currentUser.career,
      subjectName: subjectName,
      members: [], // REMOVED: currentUser._id is no longer added here
      description: `Grupo de estudio para ${subjectName} en ${careerName}..`
    });

    // 3. Attempt to create a Telegram Group and get an invite link
    let telegramChatId = null;
    let telegramInviteLink = null;
    let telegramErrorOccurred = false;
    try {
      const tgGroupDetails = await createTelegramGroup(groupName);

      if (tgGroupDetails && tgGroupDetails.chatId) {
        telegramChatId = tgGroupDetails.chatId;
        telegramInviteLink = tgGroupDetails.inviteLink;
        newGroup.telegramChatId = telegramChatId;
        newGroup.telegramInviteLink = telegramInviteLink;
        console.log(`Telegram group created: "${groupName}" (ID: ${telegramChatId}, Link: ${telegramInviteLink})`);
      } else {
         console.warn('createTelegramGroup returned no chat ID, Telegram group might not be created.');
         telegramErrorOccurred = true;
      }

    } catch (telegramError) {
      console.error('Error creating Telegram group or invite link:', telegramError.message);
      telegramErrorOccurred = true;
    }

    await newGroup.save(); // Save the group with Telegram details

    // Return the newly created group with its invite link
    if (telegramErrorOccurred) {
        res.status(201).json({
            message: `New group created for "${subjectName}", but Telegram group creation or link generation failed.`,
            group: newGroup.toObject(),
            action: 'created_with_telegram_error'
        });
    } else {
        res.status(201).json({
            message: `New group for "${subjectName}" created successfully and Telegram group linked!`,
            group: newGroup.toObject(),
            action: 'created'
        });
    }

  } catch (error) {
    console.error('Error finding or creating group:', error.message);
    res.status(500).json({ message: 'Server error during group operation.' });
  }
};

// @desc    Join an existing study group
// @route   POST /api/groups/join/:groupId
// @access  Private
const joinGroup = async (req, res) => {
  const { groupId } = req.params;
  const currentUser = req.user;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (group.members.includes(currentUser._id)) {
      return res.status(400).json({ message: 'You are already a member of this group.' });
    }

    const MAX_GROUP_SIZE = 5;
    if (group.members.length >= MAX_GROUP_SIZE) {
      return res.status(400).json({ message: 'This group is full.' });
    }

    group.members.push(currentUser._id);
    await group.save();

    currentUser.studyGroups.push(group._id);
    await currentUser.save();

    res.status(200).json({
      message: `Successfully joined group "${group.name}".`,
      group: group.toObject()
    });

  } catch (error) {
    console.error('Error joining group:', error.message);
    res.status(500).json({ message: 'Server error while joining group.' });
  }
};

// @desc    Get groups a user is part of
// @route   GET /api/groups/my-groups
// @access  Private
const getMyGroups = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'studyGroups',
      populate: {
        path: 'members',
        select: 'username first_name last_name telegramId'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      message: 'Your study groups retrieved successfully.',
      groups: user.studyGroups
    });
  } catch (error) {
    console.error('Error fetching user groups:', error.message);
    res.status(500).json({ message: 'Server error retrieving groups.' });
  }
};


export {
  findOrCreateGroup,
  joinGroup,
  getMyGroups
};