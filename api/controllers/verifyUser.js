//@author Lauchlan Toal
const client = require("./../../db");

//Call this with await verifyUser(req.headers.cookie)
//To set cookies, do res.status(xxx).cookie("usersession", "legit-cookie-yeah-man", {maxAge: 86400}).json({data})
const verifyUser = async (cookies) => {
	console.log(cookies);
	if (!cookies) {
		return null;
	}
	var allCookies = cookies.split(";");
	var i = 0;
	var userCookie = null;
	while (i < allCookies.length) {
		var currCookie = allCookies[i].trim();
		if (currCookie.substring(0, 12) == "usersession=") {
			userCookie = currCookie.split("=")[1];
			break;
		}
	}
	console.log(userCookie);
	if (!userCookie) {
		return null;
	}
	var cookieEntry;
	try {
		cookieEntry = await client.query("SELECT cookieuser FROM cookies WHERE cookieid = $1 AND cookiedate > NOW() - interval '1' day",[userCookie]);
		cookieEntry = cookieEntry.rows;
		console.log(cookieEntry);
		if (!cookieEntry[0]) {
			return null;
		}
		return cookieEntry[0].cookieuser;
	} catch {
		return null;
	}
};

module.exports = verifyUser;
