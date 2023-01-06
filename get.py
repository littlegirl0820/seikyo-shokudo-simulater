# Import libraries
from bs4 import BeautifulSoup
import requests
import re
URL_List = []
with open("hoge.txt") as f:
    URL_List = f.readlines()
cnt = 0
for URL in URL_List:
    URL = "https://west2-univ.jp/sp/"+URL[:-1]
    page = requests.get(URL)
    text = page.content
    soup = BeautifulSoup(text, "html.parser")
    tmp = soup.find_all("h1")
    tmp += soup.find_all("span", {"class": "price"})
    tmp += soup.find_all("span", {"class": "en"})
    res = []
    for idx, x in enumerate(tmp):
        y = re.sub('\<span.+?\span>', '', str(x))
        y = re.sub('\<.+?\>', '', str(y))
        res.append(y)
        # print(y)
    print("{")
    print("selected: false,")
    print("id: "+str(cnt)+",")
    print("name:\""+re.sub(r'[a-zA-Z]|\(|\)| |-|\+|，', '', res[1])+'\",')
    print(res[19].lower()+",")
    print(res[20].lower()+",")
    print(res[21].lower()+",")
    print("cost:"+re.sub('円', '', res[2])+",")
    print("},")
    cnt += 1
