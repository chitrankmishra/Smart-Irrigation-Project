function initialize() {
	console.log("Checking cookies");
	if (checkCookie()) {
		location.replace("#");
	}

	document.getElementById("queryError").style.display = "none";
	document.getElementById("querySuccess").style.display = "none";
	getSiteNameLogo();
}

async function submitQuery() {
	username = getCookie("username");
	response = await makeAsyncPostRequest("/get-user-details", {
		username: username,
	});
	email = response.result["Email"];
	query = document.getElementById("query").value;
	queryObject = { Email: email, Query: query };
	response = await makeAsyncPostRequest("/add-contact-query", queryObject);
	response = response.result;
	if (response["Comment"] == "True") {
		document.getElementById("queryError").style.display = "none";
		document.getElementById("querySuccess").style.display = "block";
	}
	if (response["Comment"] == "False") {
		document.getElementById("queryError").style.display = "block";
		document.getElementById("querySuccess").style.display = "none";
	}
}
