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
			name: "白身魚フライ",
			red: 0.5,
			green: 0.0,
			yellow: 6.7,
			cost: 220,
		},
		{
			selected: false,
			id: 6,
			name: "ししゃもフライ",
			red: 0.7,
			green: 0.0,
			yellow: 1.0,
			cost: 176,
		},
		{
			selected: false,
			id: 7,
			name: "鯖味噌煮",
			red: 1.8,
			green: 0.0,
			yellow: 0.4,
			cost: 176,
		},
		{
			selected: false,
			id: 8,
			name: "ビタミンＣサラダ",
			red: 0.0,
			green: 0.9,
			yellow: 0.6,
			cost: 110,
		},
		{
			selected: false,
			id: 9,
			name: "ちくわの磯部揚げ",
			red: 0.5,
			green: 0.0,
			yellow: 1.3,
			cost: 110,
		},
		{
			selected: false,
			id: 10,
			name: "鶏きも煮",
			red: 0.6,
			green: 0.0,
			yellow: 0.2,
			cost: 88,
		},
		{
			selected: false,
			id: 11,
			name: "オクラ巣ごもり玉子",
			red: 1.0,
			green: 0.1,
			yellow: 0.1,
			cost: 88,
		},
		{
			selected: false,
			id: 12,
			name: "ほうれん草ひじき和え，，，",
			red: 0.5,
			green: 0.1,
			yellow: 0.2,
			cost: 88,
		},
		{
			selected: false,
			id: 13,
			name: "小松菜わさび和え",
			red: 0.1,
			green: 0.1,
			yellow: 0.2,
			cost: 88,
		},
		{
			selected: false,
			id: 14,
			name: "ブロッコリーピーナッツ和え",
			red: 0.0,
			green: 0.3,
			yellow: 0.3,
			cost: 88,
		},
		{
			selected: false,
			id: 15,
			name: "ほうれん草",
			red: 0.0,
			green: 0.2,
			yellow: 0.0,
			cost: 66,
		},
		{
			selected: false,
			id: 16,
			name: "だし巻き",
			red: 1.1,
			green: 0.0,
			yellow: 0.2,
			cost: 66,
		},
		{
			selected: false,
			id: 17,
			name: "きんぴらごぼう",
			red: 0.0,
			green: 0.3,
			yellow: 0.3,
			cost: 66,
		},
		{
			selected: false,
			id: 18,
			name: "スライスオクラ",
			red: 0.0,
			green: 0.2,
			yellow: 0.0,
			cost: 66,
		},
		{
			selected: false,
			id: 19,
			name: "冷奴",
			red: 0.6,
			green: 0.0,
			yellow: 0.0,
			cost: 44,
		},
		{
			selected: false,
			id: 20,
			name: "温泉玉子",
			red: 1.0,
			green: 0.0,
			yellow: 0.0,
			cost: 44,
		},
		{
			selected: false,
			id: 21,
			name: "ミニサラダ",
			red: 0.0,
			green: 0.1,
			yellow: 0.0,
			cost: 44,
		},
		{
			selected: false,
			id: 22,
			name: "豚汁",
			red: 0.6,
			green: 0.4,
			yellow: 0.4,
			cost: 110,
		},
		{
			selected: false,
			id: 23,
			name: "味噌汁",
			red: 0.4,
			green: 0.0,
			yellow: 0.3,
			cost: 33,
		},
		{
			selected: false,
			id: 24,
			name: "温玉ぶっかけうどん",
			red: 1.0,
			green: 0.0,
			yellow: 4.2,
			cost: 297,
		},
		{
			selected: false,
			id: 25,
			name: "温玉ぶっかけそば",
			red: 1.0,
			green: 0.0,
			yellow: 3.8,
			cost: 297,
		},
		{
			selected: false,
			id: 26,
			name: "きつねうどん",
			red: 0.9,
			green: 0.0,
			yellow: 4.6,
			cost: 297,
		},
		{
			selected: false,
			id: 27,
			name: "きつねそば",
			red: 0.9,
			green: 0.0,
			yellow: 4.2,
			cost: 297,
		},
		{
			selected: false,
			id: 28,
			name: "かけうどん",
			red: 0.0,
			green: 0.0,
			yellow: 4.2,
			cost: 209,
		},
		{
			selected: false,
			id: 29,
			name: "かけそば",
			red: 0.0,
			green: 0.0,
			yellow: 3.8,
			cost: 209,
		},
		{
			selected: false,
			id: 30,
			name: "豚骨ラーメン",
			red: 0.6,
			green: 0.1,
			yellow: 5.3,
			cost: 385,
		},
	];
	idIncrement.set(31);
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
	let score = { cost: 0, red: 0.0, green: 0.0, yellow: 0.0 };
	function calcScore() {}
</script>

<h1>生協食堂シミュレータ(β)</h1>
<h2>選択した商品の合計点数と値段を表示します</h2>
<dev class="items">
	<ul>
		{#each $storeFE as item}
			<div on:change={changeSum}>
				<input type="checkbox" bind:checked={item.selected} />
				<input
					placeholder="商品名"
					bind:value={item.name}
					class="item"
				/>
				赤<input
					type="number"
					step="0.1"
					bind:value={item.red}
					class="red"
				/>
				緑<input
					type="number"
					step="0.1"
					bind:value={item.green}
					class="green"
				/>
				黄<input
					type="number"
					step="0.1"
					bind:value={item.yellow}
					class="yellow"
				/>
				値段<input type="number" bind:value={item.cost} />円
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
</dev>

<div class="optimize">
	<h2>下記の点数を取るのに最適な組み合わせを計算します．</h2>
	赤<input type="number" step="0.1" bind:value={score.red} class="red" />
	緑<input type="number" step="0.1" bind:value={score.green} class="green" />
	黄<input
		type="number"
		step="0.1"
		bind:value={score.yellow}
		class="yellow"
	/>
	<button>計算</button>
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
</style>
