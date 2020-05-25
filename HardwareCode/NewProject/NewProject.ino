#include <ESP8266WiFi.h >
#include <ESP8266HTTPClient.h >

String act_key = "asdqwe";
unsigned long scale = 1000;

int switchCount=6;
int sensorCount=2;
int switchPins[] = { 4,0,2,14,12,13};
int sensorPins[] = { 16, 5};
int autoActive[] = { 0, 0, 0, 0, 0, 0};
long runtime[] = {- 1, -1, -1, -1, -1, -1};
String switchStatus[] = { "OFF", "OFF", "OFF", "OFF", "OFF", "OFF"};
int buzzer = 15;

int buzzerTimeout = 0;
long automationTimeout = 0;
String automationSwitchStatus = "OFF";


WiFiServer server(80);
WiFiClient client;
void connectWifi(){
    const char* ssid = "Redmi";
    const char* password = "12345678";
    Serial.begin(115200);

    // Connect to WiFi network
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("");
    Serial.println("WiFi connected");

    // Start the server
    server.begin();
    Serial.println("Server started");

    // Print the IP address
    Serial.print("Use this URL to connect: ");
    Serial.print("http://");
    Serial.print(WiFi.localIP());
    Serial.println("/");
}


//utilities
int random(int a, int b){
    int val = a + (rand() % (b - a));
    return val;
}

String getString(String request, int n_slash){
    int in=0, i = 0;
    String key = "";
    for (int m = 0; m < n_slash; m++) {
        for (; i < request.length(); i++)
            if (request[i] == '/')
                break;
    }
    i++;

    for (; i < request.length(); i++) {
        if (request[i] == '/')
            break;
        key += request[i];
    }
    return key;
}

long long getNumber(String request, int n_slash){
    int in=0, i = 0;
    long long number = 0;
    for (int m = 0; m < n_slash; m++) {
        for (; i < request.length(); i++)
            if (request[i] == '/')
                break;
    }
    i++;
    for (; i < request.length(); i++) {
        if (request[i] == '/')
            break;
        number = (number * 10) + (request[i] - 48);
    }
    return number;
}

long getRuntime(String request){
    int in=request.indexOf("runtime=");
    in+=8;
    int en = request.indexOf("HTTP");
    String d = request.substring(in, en);
    return d.toInt();
}

long getIndex(String request, String keyword){
    int in =request.indexOf(keyword);
    in+=keyword.length();
    long index = 0;
    while (request[in] != '/') {
        index = index * 10 + (request[in] = '0');
        in ++;
    }
    return index;
}

String getStatus(String request, String keyword){
    int in =request.indexOf(keyword);
    in+=keyword.length();
    String status = "";
    while (request[in] != '/' && in < request.length()) {
        status += request[in];
        in ++;
    }
    return status;
}

String sendRequest(String url, String postData){
    HTTPClient http;
    //Post Data
    //postData = "status=" + ADCData + "&station=" + station ;

    http.begin(url);                            //Specify request destination
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");        //Specify content-type header

    int httpCode = http.POST(postData);
    String payload = http.getString();
    //Serial.println("");
    //Serial.println(httpCode);
    //Serial.println(payload);
    http.end();
    return payload;
}

void sendJSONData(String data){
    //structure "{\"status\": {\"led_is\": \"on\"}}"
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json");
    client.println("Access-Control-Allow-Origin: *");
    client.println("");
    client.print(data);
}




//hardware functions
int getSensorValue(int index){
    digitalWrite(sensorPins[index], LOW);
    delay(200);
    int val = analogRead(A0);
    digitalWrite(sensorPins[index], HIGH);
    Serial.println("Sensor " + String(index) + ": " + String(val));
    return val;
}

void toggleSwitch(int index){
    if (switchStatus[index] == "ON") {
        digitalWrite(switchPins[index], HIGH);
        switchStatus[index] = "OFF";
    }
    else if (switchStatus[index] == "OFF") {
        digitalWrite(switchPins[index], LOW);
        switchStatus[index] = "ON";
    }
}

void setSwitch(int index, String newStatus){
    if (newStatus == "OFF") {
        digitalWrite(switchPins[index], HIGH);
    }
    if (newStatus == "ON") {
        digitalWrite(switchPins[index], LOW);
    }
    switchStatus[index] = newStatus;
    Serial.println("Switch " + String(index) + ": " + switchStatus[index]);
}

void turnOffAll(){
    for (int i = 0; i < switchCount; i++) {
        setSwitch(i, "OFF");
    }
}

void turnOnAutomatedSwitches(int time){
    for (int i = 0; i < switchCount; i++) {
        if (autoActive[i] == 1) {
            setSwitch(i, "ON");
            runtime[i] = time * scale;
        }
    }
    Serial.println("All Switches under automation turned on..!");
}

void turnOffAutomatedSwitches(){
    for (int i = 0; i < switchCount; i++) {
        if (autoActive[i] == 1)
            setSwitch(i, "OFF");
    }
    Serial.println("All switches under automation turned off..!");
}

void sendDetails(){
    String data = "{";
    data += "\"SwitchCount\":\""+String(switchCount)+"\",";
    data += "\"SensorCount\":\""+String(sensorCount)+"\",";
    data += "\"Switch\":["; 
    for (int i = 0; i < switchCount; i++) {
        data += "{\"Status\": \"" + switchStatus[i] + "\", \"AutomationStatus\": \"" + autoActive[i] + "\"},";
    }
    data+="],";
    data += "\"Sensor\":[";
    for (int i = 0; i < sensorCount; i++) {
        data += "{\"Value\": \"" + String(getSensorValue(i)) + "\"},";
    }
    data+="],";
    data += "\"AutomationSwitch\":{\"Status\": \"" + automationSwitchStatus + "\"},";

    sendJSONData(data);
}

int calculateMoisture(){
    int sum = 0;
    for (int i = 0; i < sensorCount; i++) {
        sum += getSensorValue(i);
    }
    return sum / sensorCount;
}

void manageRequest(String request){
    if (request.indexOf("get-details") != -1) {
        client.flush();
        sendDetails();
    }
    if (request.indexOf("buzzer") != -1) {
        client.println("Buzzer Timeout Set..!");
        buzzerTimeout = 20 * scale;
        digitalWrite(buzzer, HIGH);
    }
    if (request.indexOf("index") != -1) {
        client.flush();
        int index = getIndex(request, "index=");
        String status = getStatus(request, "status=");
        if (status == "ON") {
            long time = getRuntime(request);
            if (time != 0) {
                setSwitch(index, status);
                runtime[index] = time * scale;
            }
        }
        if (status == "OFF") {
            setSwitch(index, status);
            runtime[index] = 0;
        }
        sendDetails();
    }
    if (request.indexOf("automation-control") != -1) {
        String status = getStatus(request, "automation-control=");
        automationSwitchStatus = status;
        sendDetails();
    }
    if (request.indexOf("set-automation") != -1) {
        int index = getIndex(request, "set-automation=");
        String status = getStatus(request, "status=");
        if(status=="OFF")
            autoActive[index] = 0;
        if(status=="ON")
            autoActive[index] = 1;
        sendDetails();
    }
}

void setup() {
    //Serial.begin(9600);

    for (int i = 0; i < switchCount; i++) {
        pinMode(switchPins[i], OUTPUT);
    }
    for (int i = 0; i < sensorCount; i++) {
        pinMode(sensorPins[i], OUTPUT);
    }
    pinMode(A0, INPUT);                                                                              //sensor input
    pinMode(buzzer, OUTPUT);                                                                            //Timer Pin

    turnOffAll();
    connectWifi();

    Serial.println("All Set...Entering Loop..!!");
}


void loop(){

    int moisture_percent = (int)(100 - (calculateMoisture() * 100 / 1024));
    Serial.println(String(moisture_percent) + "% " + String(getSensorValue(0)) + " " + String(getSensorValue(1)));
    automationTimeout++;

    if (buzzerTimeout > 0)
        buzzerTimeout--;
    else if (buzzerTimeout == 0) {
        digitalWrite(buzzer, LOW);
        buzzerTimeout = -1;
    }

    bool automationFlag = false;
    for (int i = 0; i < switchCount; i++) {
        if (runtime[i] > 0) {
            runtime[i]--;
        }
        else {
            runtime[i] = -1;
            setSwitch(i, "OFF");
        }
        if (autoActive[i] && runtime[i] > 0) {
            automationFlag = true;
        }
    }

    if (automationTimeout % (10 * scale) == 0 && !automationFlag && moisture_percent < 50) {
        String apiURL = "https://thawing-coast-20586.herokuapp.com/calculate-runtime/";
        String postData = "VerificationKey=" + act_key;
        for(int i=0;i<sensorCount;i++){
            postData+="&Sensor"+String(i)+"=" + String(getSensorValue(i));
        }
        postData="&AvgMoisture=" + String(calculateMoisture());
        String motor_time = sendRequest(apiURL, postData);
        if (motor_time == "")
            motor_time = "15";
        Serial.println("Motor Time=" + motor_time);
        if (motor_time != "0") {
            turnOnAutomatedSwitches(motor_time.toInt());
        }
        automationTimeout = 1;
    }

    client = server.available();
    if (!client) {
        return;
    }
    Serial.println("------------------New client-----------------");                                 // Wait until the client sends some data
    while (!client.available()) {
        //get_last_active();
        //Serial.println("Last Motors Active updated: "+String(last_active));
        delay(1);
    }

    String request = client.readStringUntil('\r');                                                   // Read the first line of the request
    Serial.print("Request:'");
    Serial.print(request);
    Serial.print("'\n");
    client.flush();

    if (request == "GET / HTTP/1.1") {
        client.flush();
    }
    else if (getString(request, 1) == act_key) {
        manageRequest(request);
        Serial.println("Managing Request");
        client.flush();
    }
    delay(1);
    Serial.println("Client disonnected");
    Serial.println("");
}
