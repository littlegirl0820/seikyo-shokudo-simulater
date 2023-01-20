<script>
    let price = 550;
    let isCasted = false;
    let res = { c: 0, r: 0.0, g: 0.0, y: 0.0, menu: [] };
    let tweetText = "";
    export let menuList = [];
    function castLots() {
        let len = menuList.length;
        let seq = [];
        for (let i = 0; i < len; i++) seq.push(i);
        let swapNum = 1000;
        for (let i = 0; i < swapNum; i++) {
            let l = Math.floor(Math.random() * len),
                r = Math.floor(Math.random() * len);
            let tmp = seq[l];
            seq[l] = seq[r];
            seq[r] = tmp;
        }
        res.c = 0;
        res.r = res.g = res.y = 0.0;
        res.menu = [];
        let cur = price;
        for (const x of seq) {
            if (menuList[x].cost <= cur) {
                cur -= menuList[x].cost;
                res.c += menuList[x].cost;
                res.r += menuList[x].red;
                res.g += menuList[x].green;
                res.y += menuList[x].yellow;
                res.menu.push(menuList[x].name);
            }
        }
        tweetText = "生協食堂";
        tweetText += price;
        tweetText += "円ガチャで%0D%0A";
        for (const x of res.menu) {
            tweetText += "『" + x + "』%0D%0A";
        }
        tweetText += "が出ました！%0D%0A";
        tweetText += "%23生協食堂ガチャ %0D%0A";
        isCasted = true;
    }
</script>

<h2>生協食堂ガチャ</h2>
<h3>指定した金額分ランダムなメニューを提示します．</h3>
<h3>曜日関係なくセットメニューも提示します．</h3>
<input type="number" bind:value={price} />円<br />

<button on:click={castLots}>ガチャ！</button>
<button
    on:click={() => {
        price = 550;
        castLots();
    }}>550円</button
>
<button
    on:click={() => {
        price = 650;
        castLots();
    }}>650円</button
>
<button
    on:click={() => {
        price = 1000;
        castLots();
    }}>1000円</button
>
<button
    on:click={() => {
        price = 1100;
        castLots();
    }}>1100円</button
>
{#if isCasted}
    <h3>
        {res.c}円 赤 {res.r.toFixed(1)}点 緑 {res.g.toFixed(1)}点 黄 {res.y.toFixed(
            1
        )}点
    </h3>

    {#each res.menu as menu}
        <div class="res">
            <li>
                {menu}
            </li>
        </div>
    {/each}
    <a
        href="https://twitter.com/share?url=https://seikyo-simulater.vercel.app/&amp;text={tweetText}"
        rel="noreferrer"
        target="_blank"
        class="twitter-share-button">ツイートする</a
    >
{/if}

<style>
    .res {
        padding: 10px;
        margin-bottom: 10px;
        border: 1px solid #333333;
        border-radius: 10px;
        text-align: center;
    }
    a.twitter-share-button {
        display: inline-block;
        color: #1da1f2;
        font-size: 1em;
        font-weight: lighter;
        border: 1px solid;
        padding: 1em;
        line-height: 1em;
        border-radius: 1em;
        text-align: center;
    }
</style>
