#!/usr/bin/env node

const MilestoneTracker = require('./milestone-tracker.js');

async function main() {
  const tracker = new MilestoneTracker();
  const data = await tracker.loadTracker();
  const milestone = tracker.findMilestone(data, data.currentMilestone);
  
  if (milestone) {
    await tracker.updateCopilotContext(data, milestone);
    console.log('✅ GitHub Copilot context updated for milestone: ' + data.currentMilestone);
  } else {
    console.error('❌ Could not find current milestone to update context: ' + data.currentMilestone);
  }
}

main().catch(console.error);
