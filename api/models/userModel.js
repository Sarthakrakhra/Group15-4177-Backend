let users = [
  {
    uuid: "95c817c5-8e2b-44ce-9895-01518d8c3ef5",
    username: "Bob",
    email: "bob@gmail.com",
  },
  {
    uuid: "1e570bb1-9e20-4a45-b7e6-91b8f6d9e025",
    username: "Sue",
    email: "sue@gmail.com",
  },
];

// Functions for updating the users array
const addUser = (user) => {
  users.push(user);
};

const updateUser = (uuid, key, newValue) => {
  const userToUpdate = users.find((user) => user.uuid === uuid);

  if (userToUpdate) {
    userToUpdate[key] = newValue;
    return true;
  }

  return false;
};

module.exports.addUser = addUser;
module.exports.updateUser = updateUser;
module.exports.userData = users;
