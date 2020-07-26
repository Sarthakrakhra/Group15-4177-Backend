//@author Lauchlan Toal
const client = require("./../../db");

//Function to parse cookie and get "usersession" cookie value
const getCookieId = async (cookies) => {
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
	if (!userCookie) {
		return null;
	}
	return userCookie;
};

//Call this with await verifyUser(req.headers.cookie)
//To set cookies, do res.status(xxx).cookie("usersession", "legit-cookie-yeah-man", {maxAge: 86400}).json({data})
const verifyUser = async (cookies) => {
	try {
		var userCookie = await getCookieId(cookies);
	} catch (err) {
		return null;
	}
	var cookieEntry;
	try {
		cookieEntry = await client.query("SELECT cookieuser FROM cookies WHERE cookieid = $1 AND cookiedate > NOW() - interval '1' day",[userCookie]);
		cookieEntry = cookieEntry.rows;
		if (!cookieEntry[0]) {
			return null;
		}
		return cookieEntry[0].cookieuser;
	} catch {
		return null;
	}
};

module.exports = {
	getCookieId: getCookieId,
	verifyUser: verifyUser,
};
