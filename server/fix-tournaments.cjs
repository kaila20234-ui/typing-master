// Patch tournaments in MongoDB to fix registration issues
// Usage: node fix-tournaments.cjs

const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/YOUR_DB_NAME'; // <-- Replace with your DB name

async function main() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const Tournament = mongoose.connection.collection('tournaments');

  // Update all tournaments with status 'registration' to ensure registration is open
  const result = await Tournament.updateMany(
    { status: 'registration' },
    { $set: { registrationDeadline: null, registrationOpen: true } }
  );

  console.log('Tournaments patched:', result.modifiedCount);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
