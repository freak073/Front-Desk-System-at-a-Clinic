module.exports = {
  $randomString,
  $randomPhoneNumber,
  $randomPriority,
  $randomName,
  $randomDoctorId,
  $futureDate,
};

function $randomString() {
  return Math.random().toString(36).substring(2, 15);
}

function $randomPhoneNumber() {
  const area = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${area}-${exchange}-${number}`;
}

function $randomPriority() {
  return Math.random() > 0.8 ? 'urgent' : 'normal';
}

function $randomName() {
  const names = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank'];
  return names[Math.floor(Math.random() * names.length)];
}

function $randomDoctorId() {
  return Math.floor(Math.random() * 10) + 1; // Assuming 10 doctors
}

function $futureDate() {
  const now = new Date();
  const future = new Date(now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000); // Next 7 days
  return future.toISOString();
}