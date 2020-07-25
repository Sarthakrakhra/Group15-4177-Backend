# Backend for Group project

## Running the server

### Running the server locally

Run the following instructions to use [Nodemon](https://www.npmjs.com/package/nodemon) to run the server

```
npm i
npm run development
```

## Routes

### Authentication feature

_Completed by Sarthak Rakhra_

- See all the users - `/user` using GET
- Login a user - `/user/login` using POST
  - Body should contain parameters in a JSON with the format: `{"username": "Some name", "password": "some password"}`
- Register a user - `/user/register` using POST
  - Body should contain parameters in a JSON with the format: `{"username": "Some name", "password": "some password", "email" : "some@email.com", "info": "Some user info"}`
- Search user - `/user/searchUser/:uuid` using GET
  - `:uuid` is replaced with the id of the user you are trying to find
- Change user password - `/user/changePassword`
  - Body should contain parameters in a JSON with the format: `{"password": "some password", "confirmPassword": "some password", "userid": "some user id"}`
  - `userid` must be passed or an error will be thrown
- Update user information - `/user/updateUserInfo` using PUT
  - Body should contain parameters in a JSON with the format: `{"username": "new username", "useremail": "new email", "userinfo": "new user info", "userid": "user id to edit"}`
  - One useful feature this route provides is that a user does not have to provide all fields (`username`, `useremail`, `userinfo`). They can provide one or more of them so that the request does not hold data which is not being editted.
  - `userid` must be passed or an error will be thrown
- Logout a user - `/user/logout`
  - Request header should contain users unique cookie value
