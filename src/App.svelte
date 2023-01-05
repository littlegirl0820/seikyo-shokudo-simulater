<script>
	import Item from "./Item.svelte";
	import { storeFE, idIncrement, sum } from "./store.js";

	$storeFE = [
		{
			selected: false,
			id: 0,
			name: "ローストンカツおろしソース",
			red: 1.8,
			green: 0.1,
			yellow: 3.3,
			cost: 308,
		},
		{
			selected: false,
			id: 1,
			name: "チキンカツ柚子胡椒マヨ",
			red: 1.3,
			green: 0.1,
			yellow: 4.0,
			cost: 264,
		},
		{
			selected: false,
			id: 2,
			name: "ハンバーグトマトソース",
			red: 1.5,
			green: 0.2,
			yellow: 1.1,
			cost: 264,
		},
		{
			selected: false,
			id: 3,
			name: "豚ブロッコリー和風炒め",
			red: 1.4,
			green: 0.8,
			yellow: 1.4,
			cost: 264,
		},
		{
			selected: false,
			id: 4,
			name: "ビーフシチュー",
			red: 1.9,
			green: 1.2,
			yellow: 0.8,
			cost: 264,
		},
		{
			selected: false,
			id: 5,
			name: "ししゃもフライ",
			red: 0.7,
			green: 0.0,
			yellow: 1.0,
			cost: 176,
		},
		{
			selected: false,
			id: 6,
			name: "鯖味噌煮",
			red: 1.8,
			green: 0.0,
			yellow: 0.4,
			cost: 176,
		},
		{
			selected: false,
			id: 7,
			name: "ジューシー唐揚げ",
			red: 2.7,
			green: 0.1,
			yellow: 2.2,
			cost: 352,
		},
		{
			selected: false,
			id: 8,
			name: "ポテト野菜サラダ",
			red: 0.0,
			green: 0.6,
			yellow: 0.6,
			cost: 110,
		},
		{
			selected: false,
			id: 9,
			name: "鶏きも煮",
			red: 0.6,
			green: 0.0,
			yellow: 0.2,
			cost: 88,
		},
		{
			selected: false,
			id: 10,
			name: "オクラ巣ごもり玉子",
			red: 1.0,
			green: 0.1,
			yellow: 0.1,
			cost: 88,
		},
		{
			selected: false,
			id: 11,
			name: "ほうれん草ひじき和え，，，",
			red: 0.5,
			green: 0.1,
			yellow: 0.2,
			cost: 88,
		},
		{
			selected: false,
			id: 12,
			name: "小松菜わさび和え",
			red: 0.1,
			green: 0.1,
			yellow: 0.2,
			cost: 88,
		},
		{
			selected: false,
			id: 13,
			name: "マカロニサラダ",
			red: 0.0,
			green: 0.0,
			yellow: 1.7,
			cost: 66,
		},
		{
			selected: false,
			id: 14,
			name: "ほうれん草",
			red: 0.0,
			green: 0.2,
			yellow: 0.0,
			cost: 66,
		},
		{
			selected: false,
			id: 15,
			name: "納豆",
			red: 0.7,
			green: 0.0,
			yellow: 0.1,
			cost: 44,
		},
		{
			selected: false,
			id: 16,
			name: "蒸し鶏ビーンズサラダ",
			red: 0.6,
			green: 0.5,
			yellow: 0.1,
			cost: 176,
		},
		{
			selected: false,
			id: 17,
			name: "豚汁",
			red: 0.6,
			green: 0.4,
			yellow: 0.4,
			cost: 110,
		},
		{
			selected: false,
			id: 18,
			name: "味噌汁",
			red: 0.4,
			green: 0.0,
			yellow: 0.3,
			cost: 33,
		},
		{
			selected: false,
			id: 19,
			name: "きつねうどん",
			red: 0.9,
			green: 0.0,
			yellow: 4.6,
			cost: 297,
		},
		{
			selected: false,
			id: 20,
			name: "きつねそば",
			red: 0.9,
			green: 0.0,
			yellow: 4.2,
			cost: 297,
		},
		{
			selected: false,
			id: 21,
			name: "かけうどん",
			red: 0.0,
			green: 0.0,
			yellow: 4.2,
			cost: 209,
		},
		{
			selected: false,
			id: 22,
			name: "かけそば",
			red: 0.0,
			green: 0.0,
			yellow: 3.8,
			cost: 209,
		},
		{
			selected: false,
			id: 23,
			name: "豚骨ラーメン",
			red: 0.6,
			green: 0.1,
			yellow: 5.3,
			cost: 385,
		},
		{
			selected: false,
			id: 24,
			name: "サーモンサラダ丼",
			red: 0.5,
			green: 0.1,
			yellow: 6.4,
			cost: 462,
		},
		{
			selected: false,
			id: 25,
			name: "ロースカツカレー",
			red: 1.6,
			green: 0.3,
			yellow: 9.1,
			cost: 407,
		},
		{
			selected: false,
			id: 26,
			name: "カレーライス",
			red: 0.2,
			green: 0.3,
			yellow: 7.0,
			cost: 308,
		},
		{
			selected: false,
			id: 27,
			name: "焼きプリンタルト",
			red: 0.0,
			green: 0.0,
			yellow: 1.5,
			cost: 66,
		},
		{
			selected: false,
			id: 28,
			name: "ベルギーワッフル",
			red: 0.0,
			green: 0.0,
			yellow: 3.5,
			cost: 110,
		},
		{
			selected: false,
			id: 29,
			name: "大学芋",
			red: 0.0,
			green: 0.8,
			yellow: 1.2,
			cost: 88,
		},
		{
			selected: false,
			id: 30,
			name: "牛乳",
			red: 1.7,
			green: 0.0,
			yellow: 0.0,
			cost: 85,
		},
		{
			selected: false,
			id: 31,
			name: "あまおうレアチーズケーキ",
			red: 0.0,
			green: 0.0,
			yellow: 1.4,
			cost: 220,
		},
		{
			selected: false,
			id: 32,
			name: "大学生協コーヒー",
			red: 1.2,
			green: 0.0,
			yellow: 0.6,
			cost: 95,
		},
	];
	idIncrement.set($storeFE.length);
	function addItem() {
		var l = $storeFE.length;
		$storeFE[l] = {
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
	$sum = { cost: 0, red: 0.0, green: 0.0, yellow: 0.0 };
	function changeSum() {
		$sum.cost = 0;
		$sum.red = 0.0;
		$sum.green = 0.0;
		$sum.yellow = 0.0;
		$storeFE.forEach((item) => {
			if (item.selected) {
				$sum.cost += item.cost;
				$sum.red += item.red;
				$sum.green += item.green;
				$sum.yellow += item.yellow;
			}
		});
	}
	let score = { cost: 0, red: 2.0, green: 1.0, yellow: 5.0 };
	let dpFlag = false;
	let res = { r: 0, g: 0, y: 0, cost: 0, menu: [] };
	let dp = [];
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

<h1>生協食堂シミュレータ(β)</h1>
<h3>最終更新 2023/01/05</h3>
<hr />
<div class="items">
	<h2>@館下食堂</h2>
	<h2>選択した商品の合計点数と値段を表示します</h2>
	<ul>
		{#each $storeFE as item}
			<div on:change={changeSum}>
				<input type="checkbox" bind:checked={item.selected} />
				<input
					placeholder="商品名"
					bind:value={item.name}
					class="item"
				/>
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
				<svelte:component this={Item} objAttributes={item} />
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

<hr />
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
<hr />
<div class="gacha">
	<h2>生協食堂ガチャ</h2>
	<h3>指定した金額分ランダムなメニューを提示します．</h3>
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
	.res {
		padding: 10px;
		margin-bottom: 10px;
		border: 1px solid #333333;
		border-radius: 10px;
		text-align: center;
	}
	/* dev.items > ul {
		width: 90%;
		height: 50%;
		overflow: scroll;
	} */
</style>
