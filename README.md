# Backend for Group project

## Running the server

### Running the server locally

Run the following instructions to use [Nodemon](https://www.npmjs.com/package/nodemon) to run the server

```
npm i
npm run development
```

## Routes

- See all the users - `/user` using GET
- Search user - `/user/searchUser/:uuid` using GET
  - `:uuid` is replaced with the id of the user you are trying to find
- Add a user - `/user/addUser` using POST
  - Use a JSON string with the format: `{"username": "Joe", "email" : "joe@gmail.com"}`
- Update a users username - `/user/modifyUser` using PUT
  - Use a JSON string with the format `{"uuid": "95c817c5-8e2b-44ce-9895-01518d8c3ef5", "username": "Bobby"}`
