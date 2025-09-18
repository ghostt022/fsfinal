var defaultTarget = "http://localhost:3000";
module.exports = [
  {
    context: ["/api/**"],
    target: defaultTarget,
    secure: false,
  },
];
