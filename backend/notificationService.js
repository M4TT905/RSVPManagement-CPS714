exports.sendEmail = async (to, subject, message) => {
  // this is a "demo email" function
  // Later, the communications team (Sub-project 8) will connect this to a real email system
  console.log(`📧 Email to ${to}: ${subject}\n${message}`);
};
