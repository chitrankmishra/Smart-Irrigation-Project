function initialize() {
	console.log("Checking cookies");
	if (checkCookie()) {
		location.replace("#");
	}
	getSiteNameLogo();
	fetchFarmNames();
	fetchCityNames();
}
function toCelsius(k) {
	var c = k - 273.15;
	return c.toFixed(2);
}

async function fetchFarmNames() {
	queryObject = { Username: getCookie("username") };
	response = await makeAsyncPostRequest("/get-farm-locations", queryObject);
	console.log(response);
	options = '< option value = "" > Select your option</option >';

	farms = response.result;
	text =
		'    <br />        <label for="farmNames">Or Select Your Farm:</label>        <select  class="form-control" id="farmNames" onchange="fetchWeather(document.getElementById(\'farmNames\').value)"><option value="">Select your option</option>';

	for (x in farms) {
		text +=
			'<option value="' +
			farms[x] +
			'">' +
			farms[x] +
			" (FarmID: " +
			x +
			")</option>";
	}
	text += "</select>";
	document.getElementById("farmOptions").innerHTML = text;
}
async function fetchCityNames() {
	queryObject = {};
	response = await makeAsyncPostRequest("/get-cities", queryObject);
	cities = response.result;
	text =
		'<label for="cityNames">Select City:</label>        <select class="form-control" id = "cityNames" onchange = \'fetchWeather(document.getElementById("cityNames").value)\'>       <option value="">Select your option</option>';

	for (x in cities)
		text +=
			'<option value = "' + cities[x] + '" >' + cities[x] + "</option >";
	text += "</select >";
	document.getElementById("cityOptions").innerHTML = text;
}
async function fetchWeather(city) {
	// console.log(timePeriod);
	if (city == "") return;
	queryObject = { City: city };
	response = await makeAsyncPostRequest("/get-weather-updates", queryObject);
	// console.log(response);
	weatherData = response.result;
	textStart = '<div class="row divWhiteBox weatherUnit mx-auto" >';
	textStart +=
		'<div class=" mx-auto weatherDataCollection col-sm-12" ><div class="row">';
	dataHeaderTextStart3 =
		'<div class="col-sm-3"><div class="row"><div class=" col-sm-6 statusDataHeader">';
	dataHeaderTextStart2 =
		'<div class="col-sm-2"><div class="row"><div class=" col-sm-12 statusDataHeader">';
	dataHeaderTextStart1 =
		'<div class="col-sm-1"><div class="row"><div class=" col-sm-12 statusDataHeader">';
	dataEnd = "</div >";
	dataEnd2 = "</div></div></div>";
	dataTextStart = '<div class=" col-sm-6 statusDataText">';
	textEnd = " </div></div></div>";
	text = "";
	for (var i = 0; i < 24; i++) {
		text += "\n\n" + textStart;

		text +=
			dataHeaderTextStart2 + (i * 3 + 3) + " Hours From Now" + dataEnd2;
		text +=
			dataHeaderTextStart3 +
			"Mean Temperature: " +
			dataEnd +
			dataTextStart +
			toCelsius(weatherData.list[i].main.temp) +
			" °C" +
			dataEnd2;
		text +=
			dataHeaderTextStart3 +
			"Description: " +
			dataEnd +
			dataTextStart +
			weatherData.list[i].weather[0].description +
			dataEnd2;
		text +=
			dataHeaderTextStart1 +
			"<img class='weatherIcon' src='images/weather_icon/" +
			weatherData.list[i].weather[0].icon +
			".png'>" +
			dataEnd2;
		text +=
			dataHeaderTextStart3 +
			"Conclusion: " +
			dataEnd +
			dataTextStart +
			weatherData.list[i].weather[0].main +
			dataEnd2;
		text += textEnd;
		// console.log(text);
	}
	document.getElementById("weatherStatus").innerHTML = text;
}
