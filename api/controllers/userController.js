const {
  userData,
  addUser: createNewUser,
  updateUser,
} = require("../models/userModel");

const searchUser = (key, value) => {
  const match = userData.find((userData) => {
    return userData[key] === value;
  });
  if (!match) throw new Error("No user found");
  return match;
};

// function to call addUser in userModel
const addUser = (newUuid, user) => {
  const match = userData.find(
    ({ uuid, email }) => uuid === newUuid || email === user.email
  );
  if (match) {
    throw new Error("User already exists!");
  } else {
    createNewUser({ uuid: newUuid, ...user });
  }
};

// function to update a given users username
const updateUsername = (uuid, newUsername) => {
  const updated = updateUser(uuid, "username", newUsername);
  if (!updated) {
    throw new Error("User with the given id was not found");
  }
};

module.exports.searchUser = searchUser;
module.exports.updateUsername = updateUsername;
module.exports.addUser = addUser;
