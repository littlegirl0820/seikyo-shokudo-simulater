<script>
    let score = { cost: 0, red: 2.0, green: 1.0, yellow: 5.0 };
    let dpFlag = false;
    let res = { r: 0, g: 0, y: 0, cost: 0, menu: [] };
    let dp = [];
    import { storeFE } from "./store.js";

    function calcScore() {
        let len = $storeFE.length;
        let r = Math.round(Math.min(score.red, 10.0) * 10);
        let g = Math.round(Math.min(score.green, 5.0) * 10);
        let y = Math.round(Math.min(score.yellow, 10.0) * 10);
        let INF = 100000;
        dp = [...Array(len + 1)].map((k) =>
            [...Array(r + 1)].map((k) =>
                [...Array(g + 1)].map((k) => [...Array(y + 1)].map((k) => INF))
            )
        );
        dp[0][0][0][0] = 0;
        for (let i = 1; i <= len; i++) {
            let cur = {
                c: $storeFE[i - 1].cost,
                r: Math.round($storeFE[i - 1].red * 10),
                g: Math.round($storeFE[i - 1].green * 10),
                y: Math.round($storeFE[i - 1].yellow * 10),
            };
            for (let j = 0; j <= r; j++) {
                for (let k = 0; k <= g; k++) {
                    for (let l = 0; l <= y; l++) {
                        dp[i][j][k][l] = Math.min(
                            dp[i][j][k][l],
                            dp[i - 1][j][k][l]
                        );
                        let J = Math.min(r, j + cur.r);
                        let K = Math.min(g, k + cur.g);
                        let L = Math.min(y, l + cur.y);
                        dp[i][J][K][L] = Math.min(
                            dp[i][J][K][L],
                            dp[i - 1][J][K][L],
                            dp[i - 1][j][k][l] + cur.c
                        );
                    }
                }
            }
            for (let j = r; j >= 0; j--) {
                for (let k = g; k >= 0; k--) {
                    for (let l = y; l >= 0; l--) {
                        if (j != r)
                            dp[i][j][k][l] = Math.min(
                                dp[i][j][k][l],
                                dp[i][j + 1][k][l]
                            );
                        if (k != g)
                            dp[i][j][k][l] = Math.min(
                                dp[i][j][k][l],
                                dp[i][j][k + 1][l]
                            );
                        if (l != y)
                            dp[i][j][k][l] = Math.min(
                                dp[i][j][k][l],
                                dp[i][j][k][l + 1]
                            );
                    }
                }
            }
        }
        res.cost = dp[len][r][g][y];
        dpFlag = true;
        let tmp = { r: r, g: g, y: y, c: res.cost };
        res.r = res.g = res.y = 0;
        res.menu = [];
        for (let i = len; i >= 1; i--) {
            let cur = {
                m: $storeFE[i - 1].name,
                c: $storeFE[i - 1].cost,
                r: Math.round($storeFE[i - 1].red * 10),
                g: Math.round($storeFE[i - 1].green * 10),
                y: Math.round($storeFE[i - 1].yellow * 10),
            };
            let isFound = false;
            for (let j = r; j >= 0; j--) {
                for (let k = g; k >= 0; k--) {
                    for (let l = y; l >= 0; l--) {
                        let J = Math.min(r, j + cur.r);
                        let K = Math.min(g, k + cur.g);
                        let L = Math.min(y, l + cur.y);
                        if (
                            dp[i - 1][j][k][l] + cur.c === tmp.c &&
                            J === tmp.r &&
                            K === tmp.g &&
                            L === tmp.y
                        ) {
                            console.log(i, j, k, l);
                            console.log(tmp);
                            res.menu.push(cur.m);
                            res.r += cur.r / 10;
                            res.g += cur.g / 10;
                            res.y += cur.y / 10;
                            isFound = true;
                            tmp.c = dp[i - 1][j][k][l];
                            tmp.r = j;
                            tmp.g = k;
                            tmp.y = l;
                            break;
                        }
                    }
                    if (isFound) break;
                }
                if (isFound) break;
            }
        }
    }
</script>

<div class="optimize">
    <h2>最適点数計算</h2>
    <h3>
        下記の点数を最も安く摂取する組み合わせを計算します．(赤:10点,緑:5点,黄:10点までしか対応していません)
    </h3>
    赤<input
        type="number"
        step="0.1"
        max="10"
        bind:value={score.red}
        class="red"
    />
    緑
    <input
        type="number"
        step="0.1"
        max="10"
        bind:value={score.green}
        class="green"
    />
    黄
    <input
        type="number"
        step="0.1"
        max="10"
        bind:value={score.yellow}
        class="yellow"
    />
    <button on:click={calcScore}>計算</button>
    <br />
    {#if dpFlag}
        <h3>
            {res.cost}円 赤 {res.r.toFixed(1)}点 緑 {res.g.toFixed(1)}点 黄 {res.y.toFixed(
                1
            )}点
        </h3>
        {#each res.menu as menu}
            <div class="res">
                <li>{menu}</li>
            </div>
        {/each}
    {/if}
</div>

<style>
    input[type="number"] {
        width: 4em;
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
    .res {
        padding: 10px;
        margin-bottom: 10px;
        border: 1px solid #333333;
        border-radius: 10px;
        text-align: center;
    }
</style>
