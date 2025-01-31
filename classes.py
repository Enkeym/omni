#!/usr/bin/env python3.8
# -*- coding: utf-8 -*-

import requests
class Omni:
    def __init__(self, url, apikey, email):
        self.url = url
        self.headers = {'Content-Type': 'application/json'}
        self.auth = (email, apikey)

    def post(self, json_data):
        return requests.post(f'{self.url}/api/cases.json', headers=self.headers, auth=self.auth, json=json_data)
        #print(r.status_code, r.reason)
        #print(r.text)

    def gettasks(self, json_data: dict):
        r = requests.get(f'{self.url}/api/cases.json', headers=self.headers, auth=self.auth, json=json_data)
        print(r.request)
        print(r.status_code, r.reason)
        print(r.text)

    def gettask(self, taskid):
        r = requests.get(f'{self.url}/api/cases/{str(taskid)}.json', headers=self.headers, auth=self.auth)
        print(r.request.url)
        print(r.status_code, r.reason)
        print(r.text)

    def deletetask(self, taskid):
        r = requests.delete(f'{self.url}/api/cases/{taskid}.json', headers=self.headers, auth=self.auth)
        print(r.status_code, r.reason)

    def edittask(self, taskid, json_data):
        return requests.put(f'{self.url}/api/cases/{taskid}.json', headers=self.headers, auth=self.auth, json=json_data)
        #print(r.status_code, r.reason)
        #print(r.text)

    def getuser(self, phone=None, email=None):
        params = {}
        if phone: params['user_phone'] = phone
        if email: params['user_email'] = email
        return requests.get(f'{self.url}/api/users.json', headers=self.headers, auth=self.auth, params=params)

    def createuser(self,json_data):
        return requests.post(f'{self.url}/api/users.json', headers=self.headers, auth=self.auth, json=json_data)

    def edituser(self, userid, json_data):
        return requests.put(f'{self.url}/api/users/{userid}.json', headers=self.headers, auth=self.auth, json=json_data)

    def deleteuser(self, userid):
        return requests.delete(f'{self.url}/api/users/{userid}.json', headers=self.headers, auth=self.auth)
        #'https://[domain].omnidesk.ru/api/cases/2000.json'
        #https: // [domain].omnidesk.ru / api / cases / [id].json