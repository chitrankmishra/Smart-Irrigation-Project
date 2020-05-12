# dependencies
from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from flask_cors import CORS
from datetime import datetime
import pymongo
import re
import requests
import time
import random

# Variables that can be modified according to the user
connection_url = 'mongodb+srv://chitrank_0614:chitrank0614@smartirrigation-scp4o.mongodb.net/test?retryWrites=true&w=majority'
regex = '^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$'


# Flask App configuration
app = Flask(__name__)
app.app_context().push()
app.config['MONGO_DBNAME'] = ''
app.config['MONGO_URI'] = connection_url
CORS(app)
mongo = PyMongo(app)

# Connection Establishment
client = pymongo.MongoClient(connection_url)
AppDatabase = client.get_database('SmartIrrigation')

# Tables
Check = AppDatabase.Check
CityCodes = AppDatabase.CityCodes
Crops = AppDatabase.Crops
Farms = AppDatabase.Farms
SiteData = AppDatabase.SiteData
UserData = AppDatabase.UserData
UserQuery = AppDatabase.UserQuery
WeatherCodes = AppDatabase.WeatherCodes

Rice = AppDatabase.Rice
Wheat = AppDatabase.Wheat
Grass = AppDatabase.Grass


# Utility Functions

def encryptPassword(password):
    return password


def fetchHeight(crop, timeDifference):
    if (crop == 'Rice'):
        query = Rice.find({'$and': [{'PeriodStart': {'$lte': timeDifference}}, {
            'PeriodEnd': {'$gte': timeDifference}}]})
    elif (crop == 'Wheat'):
        query = Wheat.find({'$and': [{'PeriodStart': {'$lte': timeDifference}}, {
            'PeriodEnd': {'$gte': timeDifference}}]})
    elif (crop == 'Grass'):
        query = Grass.find({'$and': [{'PeriodStart': {'$lte': timeDifference}}, {
            'PeriodEnd': {'$gte': timeDifference}}]})
    for doc in query:
        minHeight = doc['MinHeight']
        maxHeight = doc['MaxHeight']
        weight = random.randrange(0, 10, 1) / 10
    return (minHeight*weight+maxHeight*(1-weight))


@app.route('/add-contact-query', methods=['POST'])
def addContactQuery():
    queryEmail = request.json['Email']
    queryData = request.json['Query']
    queryObj = {'Email': queryEmail, 'Query': queryData}
    query = UserQuery.insert_one(queryObj)
    if(query.inserted_id):
        return jsonify({'result': {'Comment': 'True'}})
    else:
        return jsonify({'result': {'Comment': 'False'}})


@app.route('/calculate-runtime', methods=['POST'])
def calculateRuntime():
    verificationKey = request.form['VerificationKey']
    sensor1 = request.form['Sensor1']
    sensor2 = request.form['Sensor2']
    avgMoisture = request.form['AvgMoisture']

    farmData = Farms.find_one({'VerificationKey': verificationKey})
    motorCapacity = int(farmData['MotorCapacity'])
    crop = farmData['Crop']
    landArea = int(farmData['LandArea'])
    sownTime = farmData['SownTime']
    farmLocation = farmData['FarmLocation']

    cityCode = CityCodes.find_one({'City': farmLocation})
    cityCode = cityCode['Code']

    apiKey = "ab4ae1b0a4072f1cd0bfc3877b1dfe52"
    apiURL = "https://api.openweathermap.org/data/2.5/forecast?id="
    apiURL += str(cityCode)+"&APPID="+apiKey
    weatherData = requests.get(apiURL)
    weatherData = weatherData.json()

    y, m, d = sownTime.split('-')
    dt = datetime.strptime(d + '.' + m + '.' + y +
                           ' 00:00:00', '%d.%m.%Y %H:%M:%S')
    sownTimeSecs = int(time.mktime(dt.timetuple()))
    secs = int(round(time.time()))
    timeDifferenceMin = int((secs - sownTimeSecs)/60)

    waterHeight = fetchHeight(crop, timeDifferenceMin)
    # print(waterHeight)
    # print(weatherData)
    weatherData['list'][3]['weather'][0]['main'] = 'Snow'
    cutoff = 4
    for i in range(0, 4):
        weatherClass = weatherData['list'][i]['weather'][0]['main']
        if weatherClass in ['Tornado', 'Snow', 'Rain', 'Drizzle', 'Thunderstorm']:
            cutoff = i
            break

    waterVolume = landArea * (waterHeight/1000)
    runtime = waterVolume / motorCapacity
    runtime = round(runtime * (cutoff / 4), 2)
    if (avgMoisture < 50):
        runtime = round(runtime*(((100-avgMoisture)/50)), 2)
    return runtime


@app.route('/get-farm-details', methods=['POST'])
def getFarmDetails():
    farmID = request.json['FarmID']
    username = request.json['Username']

    farmData = Farms.find_one({'FarmID': farmID})
    remoteURL = "http://"
    remoteURL += farmData['RemoteIP'] + '/'
    remoteURL += farmData['VerificationKey'] + '/'
    remoteURL += 'get-details/'
    print("Fetching Details: Farm:"+farmID)
    response = requests.get(remoteURL)
    print(response)
    output = {}
    output['response'] = response.json()

    output['switches'] = farmData['Switches']
    output['sensors'] = farmData['Sensors']
    output['switchNames'] = farmData['SwitchNames']

    return jsonify({'result': output})


@app.route('/get-farm-data-details', methods=['POST'])
def getFarmDataDetails():
    farmID = request.json['farmID']
    query = Farms.find_one({'FarmID': farmID})
    output = {}
    output['farmLocation'] = query['FarmLocation']
    output['landArea'] = query['LandArea']
    output['motorCapacity'] = query['MotorCapacity']
    output['crop'] = query['Crop']
    output['sownTime'] = query['SownTime']
    return jsonify({'result': output})


@app.route('/get-farm-locations', methods=['POST'])
def getFarmLocations():
    username = request.json['Username']
    queryObj = {'Username': username}
    query = UserData.find_one(queryObj)
    farmIDs = query['FarmArray']
    output = {}
    for x in farmIDs:
        queryObj = {'FarmID': x}
        query = Farms.find_one(queryObj)
        output[x] = query['FarmLocation']
    return jsonify({'result': output})


@app.route('/get-cities', methods=['POST'])
def getCities():
    query = CityCodes.find()
    output = []
    for x in query:
        output.append(x['City'])
    return jsonify({'result': output})


@app.route('/get-crops', methods=['POST'])
def getCrops():
    query = Crops.find()
    output = []
    for x in query:
        output.append(x['Crop'])
    return jsonify({'result': output})


@app.route('/get-site-name-logo', methods=['POST'])
def getSiteNameLogo():
    queryObj = {'Field': 'SiteData'}
    query = SiteData.find_one(queryObj)
    output = {'Name': query['Name'], 'Logo': query['Logo']}
    return jsonify({'result': output})


@app.route('/get-weather-updates', methods=['POST'])
def getWeatherUpdates():
    city = request.json['City']
    queryObj = {'City': city}
    query = CityCodes.find_one(queryObj)
    cityCode = query['Code']
    apiKey = "ab4ae1b0a4072f1cd0bfc3877b1dfe52"
    apiURL = "https://api.openweathermap.org/data/2.5/forecast?id="
    apiURL += str(cityCode)+"&APPID="+apiKey
    response = requests.get(apiURL)
    return jsonify({'result': response.json()})


@app.route('/get-username', methods=['POST'])
def getEmail():
    email = request.json['email']
    query = UserData.find_one({'Email': email})
    return jsonify({'result': query['Username']})


@app.route('/get-user-details', methods=['POST'])
def getUserDetails():
    username = request.json['username']
    queryObj = {'Username': username}
    # print(queryObj)
    query = UserData.find_one(queryObj)
    # print(query)
    output = {}
    output['Username'] = query['Username']
    output['Email'] = query['Email']
    output['Name'] = query['Name']
    output['Mobile'] = query['MobileNumber']
    output['Farms'] = query['FarmArray']
    return jsonify({'result': output})


@app.route('/save-farm-data', methods=['POST'])
def saveFarmData():
    farmID = request.json['farmID']
    queryObj = {
        'FarmLocation': request.json['newLocation'],
        'Crop': request.json['newCrop'],
        'MotorCapacity': request.json['newMotorCapacity'],
        'LandArea': request.json['newLandArea'],
        'SownTime': request.json['newSownTime']
    }
    query = Farms.update_one({'FarmID': farmID}, {'$set': queryObj})
    if (query.acknowledged == True):
        return jsonify({'result': {'Comment': "OK"}})
    else:
        return jsonify({'result': {'Comment': "Not Ok"}})


@app.route('/save-user-data', methods=['POST'])
def saveUserData():
    oldUsername = request.json['oldUsername']
    queryObj = {
        "Username": request.json['username'],
        "Email": request.json['email'],
        "Name": request.json['name'],
        "MobileNumber": request.json['mobile']
    }
    query = UserData.update_one({"Username": oldUsername}, {'$set': queryObj})
    if(query.acknowledged):
        return jsonify({'result': {'Comment': "OK"}})
    else:
        return jsonify({'result': {'Comment': "Not Ok"}})


@app.route('/set-new-password', methods=['POST'])
def setNewPassword():
    username = request.json['username']
    password = request.json['newPassword']
    query = UserData.update_one({'Username': username}, {
                                '$set': {'Password': password}})
    if (query.acknowledged):
        return jsonify({'result': {'Comment': "OK"}})
    else:
        return jsonify({'result': {'Comment': "Not Ok"}})


@app.route('/set-automation-status', methods=['POST'])
def setAutomationStatus():
    status = request.json['status']
    farmID = request.json['farmID']
    farmData = Farms.find_one({'FarmID': farmID})
    remoteURL = "http://"
    remoteURL += farmData['RemoteIP'] + '/'
    remoteURL += farmData['VerificationKey'] + '/'
    remoteURL += 'automation-control='+status+'/'
    print("Sending automation "+status+" request: Farm:"+farmID)
    response = requests.get(remoteURL)
    print(response)
    return jsonify({'result': response.json()})


@app.route('/set-switch-automation-status', methods=['POST'])
def setSwitchAutomationStatus():
    index = str(request.json['index'])
    status = request.json['status']
    farmID = request.json['farmID']
    farmData = Farms.find_one({'FarmID': farmID})
    remoteURL = "http://"
    remoteURL += farmData['RemoteIP'] + '/'
    remoteURL += farmData['VerificationKey'] + '/'
    remoteURL += 'set-automation='+index+'/'+'status='+status+'/'
    print("Sending Switch automation "+status +
          " request: Farm:"+farmID+" Index: "+index)
    response = requests.get(remoteURL)
    print(response)

    return jsonify({'result': response.json()})


@app.route('/set-switch-status', methods=['POST'])
def setSwitchStatus():
    index = str(request.json['index'])
    status = request.json['status']
    farmID = request.json['farmID']
    farmData = Farms.find_one({'FarmID': farmID})
    remoteURL = "http://"
    remoteURL += farmData['RemoteIP'] + '/'
    remoteURL += farmData['VerificationKey'] + '/'
    remoteURL += 'index='+str(index)+'/'
    if status == 'ON':
        remoteURL += 'status=' + status + \
            '/runtime=' + request.json['time'] + '/'
    if status == 'OFF':
        remoteURL += 'status=' + status + '/'
    print("Sending switch "+status+" request: Farm:"+farmID+" Index: "+str(index))
    response = requests.get(remoteURL)
    print(response)
    return jsonify({'result': response.json()})


@app.route('/validate-user', methods=['POST'])  # Route Tested and Working`
def validateUser():
    field1 = request.json['field1']
    field2 = request.json['field2']
    print('Login: '+field1)

    password = encryptPassword(field2)
    if(re.search(regex, field1.lower())):
        query = UserData.find_one({'Email': field1})
    else:
        query = UserData.find_one({'Username': field1})
    if(query):
        if password == query['Password']:
            return jsonify({'result': 'Valid User'})
        else:
            return jsonify({'result': 'Password Incorrect'})
    else:
        return jsonify({'result': 'User Not Found'})


@app.route('/test', methods=['POST'])
def test():
    Check.insert_one({'Hello': 'There'})
    return jsonify({'result': 'done'})


if __name__ == '__main__':
    app.run(debug=True)
