<script>
    import { menuKanshita, menuFamiru, sum } from "./store.js";
    export let objAttributes = {};
    export let state = 0;
    function removeComponent() {
        if (state === 0) {
            $menuKanshita = $menuKanshita.filter(function (value) {
                if (value.id != objAttributes.id) return value;
            });
            $sum.cost = 0;
            $sum.red = 0.0;
            $sum.green = 0.0;
            $sum.yellow = 0.0;
            $menuKanshita.forEach((item) => {
                if (item.selected) {
                    $sum.cost += item.cost;
                    $sum.red += item.red;
                    $sum.green += item.green;
                    $sum.yellow += item.yellow;
                }
            });
        } else if (state === 1) {
            $menuFamiru = $menuFamiru.filter(function (value) {
                if (value.id != objAttributes.id) return value;
            });
            $sum.cost = 0;
            $sum.red = 0.0;
            $sum.green = 0.0;
            $sum.yellow = 0.0;
            $menuFamiru.forEach((item) => {
                if (item.selected) {
                    $sum.cost += item.cost;
                    $sum.red += item.red;
                    $sum.green += item.green;
                    $sum.yellow += item.yellow;
                }
            });
        }
    }
</script>

<button on:click={removeComponent}>削除</button><br />
