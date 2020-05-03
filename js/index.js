//Default Arguments and functions.

function initialize() {
	console.log("Checking cookies");
	if (checkCookie()) {
		location.replace("admin-home.html");
	}
	document.getElementById("usernameError").style.display = "none";
	document.getElementById("passwordError").style.display = "none";
	document.getElementById("userQueryDiv").style.display = "none";
	getSiteNameLogo();
}

//Required Functions and arguments

async function checkLoginCredentials_util(response, username) {
	if (response.result == "Valid User") {
		document.getElementById("usernameError").style.display = "none";
		document.getElementById("passwordError").style.display = "none";

		console.log("Login Done");
		await setCookie("username", username, 1);
		location.replace("admin-home.html");
	} else if (response.result == "Password Incorrect") {
		document.getElementById("passwordError").style.display = "block";
	} else if (response.result == "User Not Found") {
		document.getElementById("usernameError").style.display = "block";
	}
}

async function checkLoginCredentials() {
	var username = document.getElementById("username").value;
	var password = document.getElementById("password").value;

	console.log("username: " + username);
	console.log("password: " + password);
	queryObject = { field1: username, field2: password };

	response = await makeAsyncPostRequest("/validate-user", queryObject);
	checkLoginCredentials_util(response, username);
}

function contactUsShow() {
	document.getElementById("response").style.display = "none";
	document.getElementById("contactUsDiv").style.display = "block";
}
function contactUsHide() {
	document.getElementById("response").style.display = "none";
	document.getElementById("contactUsDiv").style.display = "none";
}
function contactNewAccount() {
	contactUsQuery("New Account Requested");
}
function contactUs() {
	contactUsQuery(document.getElementById("userQuery").value);
}
async function contactUsQuery(query) {
	var email = document.getElementById("contactEmail").value;
	queryObject = { Email: email, Query: query };
	var response = await makeAsyncPostRequest(
		"/add-contact-query",
		queryObject
	);
	console.log(response);
	var responseSpan = document.getElementById("response");
	if (response.result["Comment"] == "True") {
		responseSpan.classList.add("success");
		responseSpan.classList.remove("error");
		responseSpan.innerHTML = "Query Submitted Successfully";
		responseSpan.style.display = "block";
	} else {
		responseSpan.classList.add("error");
		responseSpan.classList.remove("success");
		responseSpan.innerHTML = "Query not submitted. Try again later";
		responseSpan.style.display = "block";
	}
}

function queryToggle() {
	var userQuery = document.getElementById("userQueryDiv");
	if (userQuery.style.display == "none") userQuery.style.display = "block";
	else userQuery.style.display = "none";
}
