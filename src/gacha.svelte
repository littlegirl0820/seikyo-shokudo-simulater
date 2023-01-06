<script>
    import { storeFE } from "./store.js";

    let price = 550;
    let isCasted = false;
    let res = { c: 0, r: 0.0, g: 0.0, y: 0.0, menu: [] };
    function castLots() {
        let len = $storeFE.length;
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
            console.log(x);
            if ($storeFE[x].cost <= cur) {
                cur -= $storeFE[x].cost;
                res.c += $storeFE[x].cost;
                res.r += $storeFE[x].red;
                res.g += $storeFE[x].green;
                res.y += $storeFE[x].yellow;
                res.menu.push($storeFE[x].name);
            }
        }
        isCasted = true;
    }
</script>

<h2>生協食堂ガチャ</h2>
<h3>指定した金額分ランダムなメニューを提示します．</h3>
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
{/if}

<style>
    .res {
        padding: 10px;
        margin-bottom: 10px;
        border: 1px solid #333333;
        border-radius: 10px;
        text-align: center;
    }
</style>
