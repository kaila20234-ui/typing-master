import DailyChallenge from '../models/DailyChallenge.js';
import Activity from '../models/Activity.js';

/**
 * Schedule daily challenge auto-publish job
 * Publishes challenges scheduled for today at specified time
 * @param {number} publishHour - Hour of day to publish (0-23), default 0 (midnight)
 */
export function startChallengeScheduler(publishHour = 0) {
  console.log(`✓ Daily challenge scheduler started (Publish time: ${publishHour}:00)`);

  // Check for scheduled challenges to publish
  async function checkAndPublishChallenges() {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), publishHour, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), publishHour, 0, 1);

      // Find challenges scheduled for today that are auto-publish enabled and not yet published
      const scheduledChallenges = await DailyChallenge.find({
        scheduledDate: { $gte: startOfDay, $lt: endOfDay },
        autoPublish: true,
        publishedAt: null,
      });

      for (const challenge of scheduledChallenges) {
        challenge.isActive = true;
        challenge.publishedAt = new Date();
        challenge.date = new Date(challenge.scheduledDate);
        await challenge.save();

        // Log activity
        await Activity.create({
          type: 'challenge_auto_published',
          title: `Daily challenge "${challenge.title}" auto-published`,
          description: `Challenge automatically published at scheduled time`,
          userId: null,
          username: 'system',
          relatedId: challenge._id.toString(),
          relatedType: 'DailyChallenge',
          metadata: {
            challengeId: challenge._id,
            title: challenge.title,
            autoPublished: true,
          }
        });

        console.log(`✓ Auto-published challenge: "${challenge.title}"`);
      }

      if (scheduledChallenges.length > 0) {
        console.log(`✓ Published ${scheduledChallenges.length} scheduled challenge(s)`);
      }
    } catch (error) {
      console.error('❌ Error in challenge scheduler:', error);
    }
  }

  // Calculate milliseconds until next publish time
  function getNextPublishTime() {
    const now = new Date();
    let nextPublish = new Date(now.getFullYear(), now.getMonth(), now.getDate(), publishHour, 0, 0);

    // If publish time has already passed today, schedule for tomorrow
    if (nextPublish <= now) {
      nextPublish.setDate(nextPublish.getDate() + 1);
    }

    return nextPublish.getTime() - now.getTime();
  }

  // Check immediately on startup
  checkAndPublishChallenges();

  // Schedule daily check
  setTimeout(() => {
    checkAndPublishChallenges();
    // Then check every 24 hours
    setInterval(checkAndPublishChallenges, 24 * 60 * 60 * 1000);
  }, getNextPublishTime());

  console.log(`✓ Next challenge check scheduled`);
}

/**
 * Get scheduled challenges for the next N days
 * @param {number} days - Number of days to look ahead
 */
export async function getScheduledChallenges(days = 30) {
  try {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const challenges = await DailyChallenge.find({
      scheduledDate: { $gte: now, $lte: future },
      autoPublish: true,
    }).sort({ scheduledDate: 1 });

    return challenges;
  } catch (error) {
    console.error('Error fetching scheduled challenges:', error);
    return [];
  }
}

/**
 * Manually trigger challenge publication
 */
export async function publishChallenge(challengeId) {
  try {
    const challenge = await DailyChallenge.findByIdAndUpdate(
      challengeId,
      {
        isActive: true,
        publishedAt: new Date(),
        date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
      },
      { new: true }
    );

    if (challenge) {
      console.log(`✓ Manually published challenge: "${challenge.title}"`);
    }

    return challenge;
  } catch (error) {
    console.error('Error publishing challenge:', error);
    return null;
  }
}
