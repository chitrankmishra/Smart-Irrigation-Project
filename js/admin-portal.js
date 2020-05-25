function initialize() {
	console.log("Checking cookies");
	if (checkCookie()) {
		location.replace("#");
	}
	getSiteNameLogo();
	fetchFarmNames();
}

async function fetchFarmNames() {
	queryObject = { Username: getCookie("username") };
	response = await makeAsyncPostRequest("/get-farm-locations", queryObject);
	// console.log(response);
	options = '< option value = "" > Select your option</option >';

	farms = response.result;
	text =
		'    <br />        <label for="farmNames">Or Select Your Farm:</label>        <select  class="form-control" id="farmNames" onchange="fetchDetails(document.getElementById(\'farmNames\').value)"><option value="">Select your option</option>';

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

function displayData(data) {
	// switchCount = data["switches"];
	// sensorCount = data["sensors"];
	// switchNames = data["switchNames"];
	switchCount = data.SwitchCount;
	sensorCount = data.SensorCount;
	switchNames = data.SwitchNames;

	text = "";
	text +=
		"<div class='row controlSegment'>\n        <div class='col-sm-3 mx-auto d-block'>            <button class='btn-sm button" +
		data.AutomationSwitch["Status"] +
		"' style='width:300px;' onclick='turnAutomation";
	if (data.AutomationSwitch["Status"] == "ON") text += "OFF";
	if (data.AutomationSwitch["Status"] == "OFF") text += "ON";
	text +=
		"()'>Automation System: " +
		data.AutomationSwitch["Status"] +
		"&nbsp&nbsp&nbsp&nbspTurn ";
	if (data.AutomationSwitch["Status"] == "ON") text += "OFF";
	if (data.AutomationSwitch["Status"] == "OFF") text += "ON";
	text += "</button>\n</div>\n</div>\n\n";
	finalText = text + "\n";
	finalText += "<div class='row controlSegment divWhiteBox mx-auto'>\n";
	for (var i = 0; i < sensorCount; i++) {
		text = "";
		text +=
			"<div class='col-sm-6' >\n<div class='row'> <div class='controlElement col-sm-6'>Sensor " +
			i +
			":</div>\n <div class='col-sm-6 controlElement '>\n <input type='text' class='form-control-sm' id='sensor" +
			i +
			"' value='" +
			data.Sensor[i]["Value"] +
			"%' disabled />\n </div>\n </div>\n</div>";

		finalText += text + "\n";
	}
	finalText += "</div>\n";
	for (var i = 0; i < switchCount; i++) {
		text = "";
		text +=
			"<div class='row controlSegment divWhiteBox mx-auto'>            <div class='col-sm-3 controlElement ' >                <span>Switch " +
			i +
			": " +
			switchNames[i] +
			"</span>				</div>            <div class='col-sm-3 controlElement '>                <input type='number' class='timeInput form-control-sm' id='switch" +
			i +
			"Time' placeholder='Enter the time in seconds'/";

		if (data.Switch[i]["Status"] == "ON")
			text +=
				" disabled> </div> <div class='col-sm-3 controlElement '><button class='btn-sm buttonOff' onclick='turnOFF(" +
				i +
				")'>Turn OFF</button>";
		if (data.Switch[i]["Status"] == "OFF")
			text +=
				"> </div> <div class='col-sm-3 controlElement '><button class='btn-sm buttonOn' onclick=\"turnON(document.getElementById('switch" +
				i +
				"Time')," +
				i +
				')">Turn ON</button>';
		text +=
			"</div>  <div class='col-sm-3 controlElement '> <button class='btn-sm button";
		if (data.Switch[i]["AutomationStatus"] == 0)
			text +=
				"On' onclick='turnOnSwitchAutomation(" +
				i +
				")'>Turn Automation On</button>";
		if (data.Switch[i]["AutomationStatus"] == 1)
			text +=
				"Off' onclick='turnOffSwitchAutomation(" +
				i +
				")'>Turn Automation Off</button>";
		text += "\n            </div> </div> ";
		finalText += text + "\n";
	}
	document.getElementById("controlDiv").innerHTML = finalText;
}

async function fetchDetails(farmID) {
	queryObject = { Username: getCookie("username"), FarmID: farmID };
	// response = await makeAsyncPostRequest("/get-farm-details", queryObject);
	// displayData(response.result);

	data = {
		SwitchCount: 6,
		SensorCount: 2,
		Switch: [
			{ Status: "ON", AutomationStatus: 0 },
			{ Status: "OFF", AutomationStatus: 1 },
			{ Status: "ON", AutomationStatus: 0 },
			{ Status: "OFF", AutomationStatus: 1 },
			{ Status: "ON", AutomationStatus: 0 },
			{ Status: "OFF", AutomationStatus: 1 },
		],
		Sensor: [{ Value: "10" }, { Value: "20" }],
		SwitchNames: ["Light", "Light", "Motor", "Motor", "Motor", "Motor"],
		AutomationSwitch: { Status: "ON" },
	};
	displayData(data);
	document.getElementById("warning").style.display = "none";
}

async function turnAutomationOFF() {
	queryObject = {
		status: "OFF",
		farmID: document.getElementById("farmNames").value,
	};
	response = await makeAsyncPostRequest(
		"/set-automation-status",
		queryObject
	);

	console.log(response);
	fetchDetails(document.getElementById("farmNames").value);
}
async function turnAutomationON() {
	queryObject = {
		status: "ON",
		farmID: document.getElementById("farmNames").value,
	};
	response = await makeAsyncPostRequest(
		"/set-automation-status",
		queryObject
	);

	console.log(response);
	fetchDetails(document.getElementById("farmNames").value);
}

async function turnOffSwitchAutomation(index) {
	queryObject = {
		index: index,
		status: "OFF",
		farmID: document.getElementById("farmNames").value,
	};
	response = await makeAsyncPostRequest(
		"/set-switch-automation-status",
		queryObject
	);

	console.log(response);
	fetchDetails(document.getElementById("farmNames").value);
}
async function turnOnSwitchAutomation(index) {
	queryObject = {
		index: index,
		status: "ON",
		farmID: document.getElementById("farmNames").value,
	};
	response = await makeAsyncPostRequest(
		"/set-switch-automation-status",
		queryObject
	);
	console.log(response);
	fetchDetails(document.getElementById("farmNames").value);
}

async function turnOFF(index) {
	queryObject = {
		index: index,
		status: "OFF",
		farmID: document.getElementById("farmNames").value,
	};
	response = await makeAsyncPostRequest("/set-switch-status", queryObject);
	console.log(response);
	fetchDetails(document.getElementById("farmNames").value);
}
async function turnON(time, index) {
	time = time.value.toString();
	if (time != "0" && time != "") {
		queryObject = {
			index: index,
			status: "ON",
			time: time,
			farmID: document.getElementById("farmNames").value,
		};
		response = await makeAsyncPostRequest(
			"/set-switch-status",
			queryObject
		);
		console.log(response);
		fetchDetails(document.getElementById("farmNames").value);
	}
}
