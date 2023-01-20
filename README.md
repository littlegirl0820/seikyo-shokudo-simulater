# 生協食堂シミュレータ
## 概要
阪大の生協食堂のメニューを分かりやすく管理し日々の食事の選択に彩りを与えたい．

あとそんなつもりはなかったけど，レシートから点数が消えたのでそれを悲しむ阪大生の助けになりたい．
## 始め方
### ローカル
cloneした後
```bash
cd seikyo-simulator
npm install
npm run dev
```
で遊べるはず
### ブラウザ
[ここから](https://seikyo-simulater.vercel.app/)試せます．
## 機能
### 商品一覧
選んだ商品の値段と点数がわかる．商品追加・削除もできる．2個以上選びたいときは追加してね．
## 最適点数計算
指定した点数を最安値で獲得できるメニューを表示する．嫌いなメニューがあれば商品一覧から削除すると出てこなくなる．
## ガチャ
指定した金額分のガチャが回せる．ご飯に迷ったら使ってください．ミール勢に優しい仕様で固定で `550円`,`650円`,`1100円`となんとなく`1000円`がある．金額迷ったらどれか押すといいと思う．

ツイート機能もあるのでしてくれるとうれしいです．
## 質問・要望等
githubの[issue](https://github.com/littlegirl0820/seikyo-simulater/issues)かTwitter([@littlegirl0820](https://twitter.com/littlegirl0820))まで