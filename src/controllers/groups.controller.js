// src/controllers/groups.controller.js
import { Group } from '../models/Groups.js'; // Note the .js extension and named import
import { User } from '../models/Users.js'; // Note the .js extension and named import
import Career from '../models/Career.js'; // Note the .js extension
import { createTelegramGroup, addTelegramGroupMembers } from '../services/telegram.js'; // Import Airgram service

// @desc    Find or create a study group for a specific subject
// @route   POST /api/groups/find-or-create
// @access  Private (requires JWT auth)
const findOrCreateGroup = async (req, res) => {
  const { subjectName, desiredSemesterNumber } = req.body;
  const currentUser = req.user; // User attached by protect middleware

  if (!subjectName) {
    return res.status(400).json({ message: 'Subject name is required.' });
  }

  if (!currentUser.career || !currentUser.currentSemesterNumber) {
      return res.status(400).json({ message: 'User profile incomplete. Please set your career and current semester first.' });
  }

  // Determine the semester to search/create for
  // If desiredSemesterNumber is provided, use it, otherwise use currentSemesterNumber
  const targetSemester = desiredSemesterNumber || currentUser.currentSemesterNumber;

  try {
    // 1. Search for existing, joinable groups
    let existingGroups = await Group.find({
      career: currentUser.career,
      subjectName: subjectName,
      semesterNumber: targetSemester,
      members: { $ne: currentUser._id } // User not already a member
    })
    .populate('members', 'username first_name last_name') // Populate members for display, matching User model
    .sort({ createdAt: -1 }) // Newest first
    .lean(); // Return plain JS objects for modification if needed

    const MAX_GROUP_SIZE = 10; // Define your max group size
    existingGroups = existingGroups.filter(group => group.members.length < MAX_GROUP_SIZE);

    if (existingGroups.length > 0) {
      // Found existing groups, return them
      return res.status(200).json({
        message: `Found ${existingGroups.length} existing groups for "${subjectName}" in Semester ${targetSemester}.`,
        groups: existingGroups,
        action: 'found'
      });
    }

    // 2. No suitable groups found, automatically create a new one
    console.log(`No existing groups for "${subjectName}" (Semester ${targetSemester}) in ${currentUser.career}. Creating a new one...`);

    // Fetch the career name for the group name
    const careerObj = await Career.findById(currentUser.career);
    const careerName = careerObj ? careerObj.name : 'Unknown Career';

    const groupName = `Study Group: ${subjectName} (${careerName} - Sem ${targetSemester})`;
    const newGroup = new Group({
      name: groupName,
      career: currentUser.career,
      semesterNumber: targetSemester,
      subjectName: subjectName,
      members: [currentUser._id], // Creator is the first member
      description: `A study group for ${subjectName} in ${careerName}, Semester ${targetSemester}.`
    });

    await newGroup.save();

    // Add group to user's studyGroups list
    currentUser.studyGroups.push(newGroup._id);
    await currentUser.save();

    // 3. Attempt to create a Telegram Group
    let telegramChatId = null;
    let telegramErrorOccurred = false;
    try {
      // Pass the currentUser's Telegram ID to potentially add them to the group
      // createTelegramGroup will need to resolve this to an actual TDLib user ID
      const telegramGroupChat = await createTelegramGroup(
        groupName,
        [currentUser.telegramId] // Pass Telegram ID of the creator
      );

      if (telegramGroupChat && telegramGroupChat.id) {
        telegramChatId = telegramGroupChat.id;
        newGroup.telegramChatId = String(telegramChatId); // Store as string
        await newGroup.save(); // Update group with Telegram chat ID
        console.log(`Telegram group created: "${groupName}" (ID: ${telegramChatId})`);
      } else {
         console.warn('createTelegramGroup returned no chat ID, Telegram group might not be created.');
         telegramErrorOccurred = true;
      }

    } catch (telegramError) {
      console.error('Error creating Telegram group:', telegramError.message);
      telegramErrorOccurred = true;
    }

    // Return the newly created group
    if (telegramErrorOccurred) {
        res.status(201).json({
            message: `New group created for "${subjectName}", but Telegram group creation failed.`,
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

    const MAX_GROUP_SIZE = 10; // Define your max group size
    if (group.members.length >= MAX_GROUP_SIZE) {
      return res.status(400).json({ message: 'This group is full.' });
    }

    group.members.push(currentUser._id);
    await group.save();

    currentUser.studyGroups.push(group._id);
    await currentUser.save();

    // Attempt to add user to Telegram group if it exists
    if (group.telegramChatId) {
      try {
        await addTelegramGroupMembers(group.telegramChatId, [currentUser.telegramId]);
        console.log(`Added user ${currentUser.username} to Telegram chat ${group.telegramChatId}`);
      } catch (tgError) {
        console.warn(`Failed to add user to Telegram chat ${group.telegramChatId}:`, tgError.message);
        // Log but don't fail the HTTP request if Telegram part fails
      }
    }

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
        select: 'username first_name last_name telegramId' // Select fields for members
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