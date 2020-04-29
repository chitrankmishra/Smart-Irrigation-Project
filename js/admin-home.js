function initialize() {
	console.log("Checking cookies");
	if (checkCookie()) {
		location.replace("#");
	}
	getSiteNameLogo();
}
