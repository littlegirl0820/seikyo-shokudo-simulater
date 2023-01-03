<script>
    import { storeFE, sum } from "./store.js";
    export let objAttributes = {};

    function removeComponent() {
        $storeFE = $storeFE.filter(function (value) {
            if (value.id != objAttributes.id) return value;
        });
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
</script>

<button on:click={removeComponent}>削除</button><br />
