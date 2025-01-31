r = om.getuser(phone=phone)
print('getuser', r.text)

if r.json():
    user = r.json().get('0', {}).get('user', {})
    userid = user.get('user_id')

    if not user.get('user_full_name'):
        juser['user'].pop('user_email', None)
        juser['user'].pop('user_phone', None)
        juser['user'].pop('user_telegram', None)
        r = om.edituser(userid, json_data=juser)
        print('edituser (добавить данные в профиль)', r.text)
    else:
        juser['user'].pop('user_email', None)
        juser['user'].pop('user_phone', None)
        juser['user'].pop('user_telegram', None)
        r = om.edituser(userid, json_data=juser)
        print('edituser (обновить данные профиля)', r.text)
else:
    print(juser)
    r = om.createuser(juser)
    print('createuser', r.text)
