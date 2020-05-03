function initialize() {
	console.log("Checking cookies");
	if (checkCookie()) {
		location.replace("#");
	}
	getSiteNameLogo();
	getUserDetails();
	fetchCityNames();
	fetchCropNames();
}

async function fetchCropNames() {
	queryObject = {};
	response = await makeAsyncPostRequest("/get-crops", queryObject);
	crops = response.result;
	text =
		'<select class="form-control" id = "cropNames">       <option value="">Select your option</option>';

	for (x in crops)
		text +=
			'<option value = "' + crops[x] + '" >' + crops[x] + "</option >";
	text += "</select >";
	document.getElementById("cropOptions").innerHTML = text;
}

async function fetchCityNames() {
	queryObject = {};
	response = await makeAsyncPostRequest("/get-cities", queryObject);
	cities = response.result;
	text =
		'<select class="form-control" id = "cityNames">       <option value="">Select your option</option>';

	for (x in cities)
		text +=
			'<option value = "' + cities[x] + '" >' + cities[x] + "</option >";
	text += "</select >";
	document.getElementById("cityOptions").innerHTML = text;
}

async function fetchFarmDataDetails(farmID) {
	document.getElementById("saveFarmMsg").style.display = "none";
	document.getElementById("errorSaveFarmMsg").style.display = "none";
	queryObject = { farmID: farmID };
	response = await makeAsyncPostRequest(
		"/get-farm-data-details",
		queryObject
	);
	data = response.result;
	document.getElementById("cityNames").value = data["farmLocation"];
	document.getElementById("cropNames").value = data["crop"];
	document.getElementById("motorCapacity").value = data["motorCapacity"];
	document.getElementById("landArea").value = data["landArea"];
	document.getElementById("sownTime").value = data["sownTime"];
}

async function getUserDetails() {
	document.getElementById("saveMsg").style.display = "none";
	document.getElementById("errorsaveMsg").style.display = "none";

	username = getCookie("username");
	queryObject = { username: username };
	response = await makeAsyncPostRequest("/get-user-details", queryObject);
	document.getElementById("name").value = response.result["Name"];
	document.getElementById("username").value = response.result["Username"];
	document.getElementById("email").value = response.result["Email"];
	document.getElementById("mobile").value = response.result["Mobile"];

	options = '< option value = "" > Select your option</option >';

	farms = response.result["Farms"];
	text =
		'    <br />        <label for="farmNames">Select Your Farm To Modify Settings:</label>        <select  class="form-control" id="farmNames" onchange="fetchFarmDataDetails(document.getElementById(\'farmNames\').value)"><option value="">Select your option</option>';

	for (x in farms) {
		text +=
			'<option value="' +
			x +
			'">' +
			farms[x] +
			" (FarmID: " +
			x +
			")</option>";
	}
	text += "</select>";
	document.getElementById("farmOptions").innerHTML = text;
}

function checkUsernameAvailability() {
	username = document.getElementById("username").value;
	email = document.getElementById("email").value;
}

async function saveUserdata() {
	name = document.getElementById("name").value;
	username = document.getElementById("username").value;
	email = document.getElementById("email").value;
	mobile = document.getElementById("mobile").value;

	queryObject = {
		oldUsername: getCookie("username"),
		name: name,
		username: username,
		email: email,
		mobile: mobile,
	};
	response = await makeAsyncPostRequest("/save-user-data", queryObject);
	if (response.result["Comment"] == "OK") {
		deleteCookies();
		setCookie("username", username, 1);
		getUserDetails();
		document.getElementById("saveMsg").style.display = "block";
		document.getElementById("errorsaveMsg").style.display = "none";
	} else {
		document.getElementById("errorsaveMsg").style.display = "block";
		document.getElementById("saveMsg").style.display = "none";
	}
}

async function saveFarmdata() {
	queryObject = {
		farmID: document.getElementById("farmNames").value,
		newLocation: document.getElementById("cityNames").value,
		newCrop: document.getElementById("cropNames").value,
		newMotorCapacity: document.getElementById("motorCapacity").value,
		newLandArea: document.getElementById("landArea").value,
		newSownTime: document.getElementById("sownTime").value,
	};
	response = await makeAsyncPostRequest("/save-farm-data", queryObject);
	if (response.result["Comment"] == "OK") {
		document.getElementById("saveFarmMsg").style.display = "block";
		document.getElementById("errorSaveFarmMsg").style.display = "none";
	} else {
		document.getElementById("errorSaveFarmMsg").style.display = "block";
		document.getElementById("saveFarmMsg").style.display = "none";
	}
}

async function setNewPassword() {
	var newPassword = document.getElementById("newPassword").value;
	var conPassword = document.getElementById("confirmPassword").value;

	if (newPassword != conPassword) {
		document.getElementById("passwordError").style.display = "block";
		document.getElementById("passwordSuccess").style.display = "none";
	} else {
		queryObject = {
			newPassword: newPassword,
			username: getCookie("username"),
		};
		query = await makeAsyncPostRequest("/set-new-password", queryObject);
		if (query.result["Comment"] == "OK") {
			document.getElementById("passwordError").style.display = "none";
			document.getElementById("passwordSuccess").style.display = "block";
		} else {
			document.getElementById("passwordError").style.display = "block";
			document.getElementById("passwordSuccess").style.display = "none";
		}
	}
}
