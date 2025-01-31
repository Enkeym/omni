#!/usr/bin/env python3.8
# -*- coding: utf-8 -*-
# 67029 - рега
# 69300 - тест
# 69657 - УПД
import re
from flask import Flask, Response, request
from classes import Omni
import requests

app = Flask(__name__)
om = Omni('https://getmark.omnidesk.ru', 'f55576e86d36f8a4a41e8a828', 'help@getmark.ru')
print(om)

def register(args):
    print(len(args))
    typ = args.split('|')[0]
    if typ == 'register':
        fields = args.split('|')
        if len(fields) != 16:
            print(f"Ошибка: ожидалось 16 элементов, получено {len(fields)}. Данные: {fields}")
            return
        typ, tid, surname, name, email, company, contname, phone, inn, contmail, tg, cat, role, tarif, comment, gs1 = fields
        url = f'https://getmark.bitrix24.ru/crm/deal/details/{tid}/'
        tarif = re.findall(r'(?<=\[td\])(.*?)(?=\[\/td\])', tarif)
        del tarif[1::2]
        tarif = '\n'.join(tarif)
        tarif = re.sub(r'[«»]','"',tarif)
        emo = '📑' if role == 'Производитель' else '📄'
        gs1 = '🌐' if gs1 == 'Да' else ''
        wa = sendwa(phone)
        jdict = {
            'case': {
                'user_email': email,
                'cc_emails':['vshumovsky@getmark.ru'],
                'status': 'open',
                'user_full_name': f'{surname} {name}',
                'subject': f'{emo}{"❗" if comment else ""}{gs1} Регистрация. {company}',
                'content': f'Организация: {company}\nКонтакт: {phone} {contname}\nКатегория: {cat} {role}\nТариф: {tarif}\nИнструкция {wa}\nСсылка на заявку: {url}\n{"🌐 Регистрация в ГС1!" if gs1 else ""}\n{"❗ Комментарий: " if comment else ""}{comment}\n',
            }
        }
        r = om.post(jdict)
        print(r.status_code)
        #if r.status_code != 200: pass # сделать оповещение об ошибке

        juser = {
            'user': {
                'user_full_name': contname,
                'company_name': company,
                'company_position':inn,
                'user_phone': phone,
                'user_email': contmail,
                'user_telegram': tg.replace('@',''),
                'user_note': tarif
            }
        }

        r = om.getuser(phone=phone)
        print('getuser', r.text)

        if not r.json():
            print(juser)
            r = om.createuser(juser)
            print('createuser1', r.text)
            return

        user = r.json()['0']['user']
        userid = user['user_id']
        if not user['user_full_name']:
            om.deleteuser(userid)
            r = om.createuser(juser)
            print(juser)
            print('createuser', r.text)
            return

        juser['user'].pop('user_email')
        juser['user'].pop('user_phone')
        juser['user'].pop('user_telegram')
        r = om.edituser(userid, json_data=juser)
        print('edituser', r.text)


    if typ == 'test':
        tov = args.split('|')[1]
        tov = re.findall(r'(?<=\[td\])(.*?)(?=\[\/td\])', tov)
        del tov[1::2]
        print(tov)

def sendwa(phone):
    phone = re.sub(r'\D','',phone)
    url = "https://api.wazzup24.com/v3/message"
    headers = {"Content-Type": "application/json", "Authorization": "Bearer 9f040b19595448d282b31cb2d270d68b"}
    data = {
        "channelId": "e06255f2-0bb6-412c-abff-e608200837a0",
        "chatId": phone,
        "chatType": "whatsapp",
        "text": """Здравствуйте.
Вас приветствует технический отдел компании “GetMark”!
К нам поступила заявка на регистрацию Вашей организации в нашем сервисе.
Для успешной процедуры понадобятся:
- электронная подпись (УКЭП)
- компьютер с выходом в интернет
- мобильный телефон (для получения смс-подтверждения)
- программное обеспечение “КриптоПро” и “AnyDesk”
- реквизиты организации (паспортные данные, код налоговой, бик и р/с банка)

Ссылки на скачивание П.О.:
- AnyDesk: https://anydesk.com/ru ( инструкция для пользователей MacOS: https://getmark.omnidesk.ru/knowledge_base/item/282945?sid=61673 )
- КриптоПро: https://www.cryptopro.ru/products/csp"""
    }
    data2 = {
        "channelId": "e06255f2-0bb6-412c-abff-e608200837a0",
        "chatId": phone,
        "chatType": "whatsapp",
        "text": """Ожидайте звонка нашего специалиста для согласования времени проведения процедуры регистрации.
Будьте готовы назвать номер рабочего стола указанный в AnyDesk, если желаете начать регистрацию сразу.

В нашем телеграм-канале вы найдёте всю актуальную информацию о маркировке товаров.
Наши операторы помогут в решении проблем и ответят на все ваши вопросы! https://t.me/getmarkk 

⚠️ Это автоматические сообщения, отвечать на них не нужно!"""
    }
    response = requests.post(url, headers=headers, json=data)
    response2 = requests.post(url, headers=headers, json=data2)
    return 'отправлена ✔️' if response.status_code == 201 and response2.status_code == 201 else 'не отправлена ❌'


@app.route('/<path:fullpath>', methods=['POST'])
def manage_post(fullpath):
    print('got post')
    
    if request.data:
        args = request.data.decode('utf-8')  
        register(args) 
    else:
        print("Ошибка: тело запроса пустое") 
    
    return Response(status=200)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80, debug=True)