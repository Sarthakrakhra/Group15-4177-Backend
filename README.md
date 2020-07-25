# Backend for Group project

API calls can be made to the endpoint: https://a4-4177-g15.herokuapp.com/ 

## Files created for the assignment
- index.js
  - Authors: Sarthak Rakhra, Lauchlan Toal, Sally Keating, Skyler Boutilier
- db.js
  - Authors: Sarthak Rakhra
- verifyUser.js
  - Authors: Lauchlan Toal
- forumRoute.js
  - Authors: Lauchlan Toal
- threadRoute.js
  - Authors: Lauchlan Toal
- userRoute.js
  - Authors: Sarthak Rakhra and Lauchlan Toal
- mediauploadRoute.js, and on the front-end [MediaUpload.js](https://github.com/Sarthakrakhra/4177Group15Project/blob/master/src/Components/MediaUpload.js)
  - Authors: Sally Keating


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


### Media Uploding Feature

_Completed by Sally Keating_

- With this feature it is extremely important to ensure users find the process intuitive. Therefore, I used basic methods and realiable UI to ensure the task is straight forward. 
- I created this feature using both front and back-end as the user will have to upload a file to the front-end and then it will be stored on the backend. 
- This process can be seen by navigating to `/upload`
