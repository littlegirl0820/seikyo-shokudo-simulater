<script>
    import { idIncrement, sum } from "./store.js";
    import Item from "./item.svelte";
    export let state = 0;
    export let menuList = [];
    function addItem() {
        var l = menuList.length;
        menuList[l] = {
            selected: false,
            id: $idIncrement,
            name: "",
            red: 0.0,
            green: 0.0,
            yellow: 0.0,
            cost: 0,
        };
        $idIncrement++;
    }
    function changeSum() {
        $sum.cost = 0;
        $sum.red = 0.0;
        $sum.green = 0.0;
        $sum.yellow = 0.0;
        menuList.forEach((item) => {
            if (item.selected) {
                $sum.cost += item.cost;
                $sum.red += item.red;
                $sum.green += item.green;
                $sum.yellow += item.yellow;
            }
        });
    }
</script>

<div class="items">
    <h2>
        {#if state === 0}
            @館下食堂
        {:else if state === 1}
            @ファミール
        {:else if state === 2}
            @かさね
        {:else if state === 3}
            @レインボー
        {/if}
    </h2>
    <h2>選択した商品の合計点数と値段を表示します</h2>
    <label for="expansion">展開</label>
    <input
        type="checkbox"
        id="expansion"
        class="accordion"
        style="display:none;"
    />
    <ul id="link">
        {#each menuList as item}
            <div on:change={changeSum}>
                <li>
                    <input type="checkbox" bind:checked={item.selected} />
                    <input
                        placeholder="商品名"
                        bind:value={item.name}
                        class="item"
                    />
                    <br />
                    赤
                    <input
                        type="number"
                        step="0.1"
                        bind:value={item.red}
                        class="red"
                    />
                    緑
                    <input
                        type="number"
                        step="0.1"
                        bind:value={item.green}
                        class="green"
                    />
                    黄
                    <input
                        type="number"
                        step="0.1"
                        bind:value={item.yellow}
                        class="yellow"
                    />
                    値段 <input type="number" bind:value={item.cost} />円
                    <svelte:component
                        this={Item}
                        objAttributes={item}
                        {state}
                    />
                </li>
            </div>
        {/each}
    </ul>
    <h3>
        <strong>合計金額</strong>
        {$sum.cost}円 赤 {$sum.red.toFixed(1)}点 緑 {$sum.green.toFixed(1)}点 黄 {$sum.yellow.toFixed(
            1
        )}点
    </h3>
    <button on:click={addItem}>商品を追加する</button>
</div>

<style>
    .items > h3 {
        text-align: right;
    }
    input[type="number"] {
        width: 4em;
    }
    input.item {
        width: 20em;
    }
    input.red {
        background-color: rgb(255, 205, 188);
    }
    input.green {
        background-color: rgb(200, 255, 177);
    }
    input.yellow {
        background-color: rgb(255, 248, 177);
    }

    label {
        /* width: 15%; */
        display: block;
        margin: 0;
        padding: 15px;
        line-height: 1;
        color: #fff;
        background: tomato;
        cursor: pointer;
        border-radius: 1em;
        text-align: center;
    }

    .items ul {
        width: 100%;
        margin: 0px 0;
        padding: 0;
        list-style: none;
        text-align: center;
    }

    .items li {
        height: 0;
        overflow: hidden;
        -webkit-transition: all 0.5s;
        -moz-transition: all 0.5s;
        -ms-transition: all 0.5s;
        -o-transition: all 0.5s;
        transition: all 0.5s;
    }

    #expansion:checked ~ #link li {
        height: 6.5em;
        opacity: 1;
    }
</style>
