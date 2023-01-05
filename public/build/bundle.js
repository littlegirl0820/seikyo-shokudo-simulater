
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.54.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let storeFE = writable({});
    let idIncrement = writable({});
    let sum = writable({});

    /* src\Item.svelte generated by Svelte v3.54.0 */
    const file$1 = "src\\Item.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let br;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "削除";
    			br = element("br");
    			add_location(button, file$1, 23, 0, 628);
    			add_location(br, file$1, 23, 46, 674);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, br, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*removeComponent*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(br);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $sum;
    	let $storeFE;
    	validate_store(sum, 'sum');
    	component_subscribe($$self, sum, $$value => $$invalidate(2, $sum = $$value));
    	validate_store(storeFE, 'storeFE');
    	component_subscribe($$self, storeFE, $$value => $$invalidate(3, $storeFE = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Item', slots, []);
    	let { objAttributes = {} } = $$props;

    	function removeComponent() {
    		set_store_value(
    			storeFE,
    			$storeFE = $storeFE.filter(function (value) {
    				if (value.id != objAttributes.id) return value;
    			}),
    			$storeFE
    		);

    		set_store_value(sum, $sum.cost = 0, $sum);
    		set_store_value(sum, $sum.red = 0.0, $sum);
    		set_store_value(sum, $sum.green = 0.0, $sum);
    		set_store_value(sum, $sum.yellow = 0.0, $sum);

    		$storeFE.forEach(item => {
    			if (item.selected) {
    				set_store_value(sum, $sum.cost += item.cost, $sum);
    				set_store_value(sum, $sum.red += item.red, $sum);
    				set_store_value(sum, $sum.green += item.green, $sum);
    				set_store_value(sum, $sum.yellow += item.yellow, $sum);
    			}
    		});
    	}

    	const writable_props = ['objAttributes'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('objAttributes' in $$props) $$invalidate(1, objAttributes = $$props.objAttributes);
    	};

    	$$self.$capture_state = () => ({
    		storeFE,
    		sum,
    		objAttributes,
    		removeComponent,
    		$sum,
    		$storeFE
    	});

    	$$self.$inject_state = $$props => {
    		if ('objAttributes' in $$props) $$invalidate(1, objAttributes = $$props.objAttributes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [removeComponent, objAttributes];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { objAttributes: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get objAttributes() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set objAttributes(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.54.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[23] = list;
    	child_ctx[24] = i;
    	return child_ctx;
    }

    // (451:2) {#each $storeFE as item}
    function create_each_block_1(ctx) {
    	let div;
    	let input0;
    	let t0;
    	let input1;
    	let t1;
    	let input2;
    	let t2;
    	let input3;
    	let t3;
    	let input4;
    	let t4;
    	let input5;
    	let t5;
    	let switch_instance;
    	let t6;
    	let current;
    	let mounted;
    	let dispose;

    	function input0_change_handler() {
    		/*input0_change_handler*/ ctx[8].call(input0, /*each_value_1*/ ctx[23], /*item_index*/ ctx[24]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[9].call(input1, /*each_value_1*/ ctx[23], /*item_index*/ ctx[24]);
    	}

    	function input2_input_handler() {
    		/*input2_input_handler*/ ctx[10].call(input2, /*each_value_1*/ ctx[23], /*item_index*/ ctx[24]);
    	}

    	function input3_input_handler() {
    		/*input3_input_handler*/ ctx[11].call(input3, /*each_value_1*/ ctx[23], /*item_index*/ ctx[24]);
    	}

    	function input4_input_handler() {
    		/*input4_input_handler*/ ctx[12].call(input4, /*each_value_1*/ ctx[23], /*item_index*/ ctx[24]);
    	}

    	function input5_input_handler() {
    		/*input5_input_handler*/ ctx[13].call(input5, /*each_value_1*/ ctx[23], /*item_index*/ ctx[24]);
    	}

    	var switch_value = Item;

    	function switch_props(ctx) {
    		return {
    			props: { objAttributes: /*item*/ ctx[22] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = text("\n\t\t\t\t赤\n\t\t\t\t");
    			input2 = element("input");
    			t2 = text("\n\t\t\t\t緑\n\t\t\t\t");
    			input3 = element("input");
    			t3 = text("\n\t\t\t\t黄\n\t\t\t\t");
    			input4 = element("input");
    			t4 = text("\n\t\t\t\t値段 ");
    			input5 = element("input");
    			t5 = text("円\n\t\t\t\t");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t6 = space();
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file, 452, 4, 7622);
    			attr_dev(input1, "placeholder", "商品名");
    			attr_dev(input1, "class", "item svelte-1fim4ju");
    			add_location(input1, file, 453, 4, 7681);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "step", "0.1");
    			attr_dev(input2, "class", "red svelte-1fim4ju");
    			add_location(input2, file, 459, 4, 7774);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "step", "0.1");
    			attr_dev(input3, "class", "green svelte-1fim4ju");
    			add_location(input3, file, 466, 4, 7877);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "step", "0.1");
    			attr_dev(input4, "class", "yellow svelte-1fim4ju");
    			add_location(input4, file, 473, 4, 7984);
    			attr_dev(input5, "type", "number");
    			attr_dev(input5, "class", "svelte-1fim4ju");
    			add_location(input5, file, 479, 7, 8090);
    			add_location(div, file, 451, 3, 7590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			input0.checked = /*item*/ ctx[22].selected;
    			append_dev(div, t0);
    			append_dev(div, input1);
    			set_input_value(input1, /*item*/ ctx[22].name);
    			append_dev(div, t1);
    			append_dev(div, input2);
    			set_input_value(input2, /*item*/ ctx[22].red);
    			append_dev(div, t2);
    			append_dev(div, input3);
    			set_input_value(input3, /*item*/ ctx[22].green);
    			append_dev(div, t3);
    			append_dev(div, input4);
    			set_input_value(input4, /*item*/ ctx[22].yellow);
    			append_dev(div, t4);
    			append_dev(div, input5);
    			set_input_value(input5, /*item*/ ctx[22].cost);
    			append_dev(div, t5);
    			if (switch_instance) mount_component(switch_instance, div, null);
    			append_dev(div, t6);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", input0_change_handler),
    					listen_dev(input1, "input", input1_input_handler),
    					listen_dev(input2, "input", input2_input_handler),
    					listen_dev(input3, "input", input3_input_handler),
    					listen_dev(input4, "input", input4_input_handler),
    					listen_dev(input5, "input", input5_input_handler),
    					listen_dev(div, "change", /*changeSum*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$storeFE*/ 8) {
    				input0.checked = /*item*/ ctx[22].selected;
    			}

    			if (dirty & /*$storeFE*/ 8 && input1.value !== /*item*/ ctx[22].name) {
    				set_input_value(input1, /*item*/ ctx[22].name);
    			}

    			if (dirty & /*$storeFE*/ 8 && to_number(input2.value) !== /*item*/ ctx[22].red) {
    				set_input_value(input2, /*item*/ ctx[22].red);
    			}

    			if (dirty & /*$storeFE*/ 8 && to_number(input3.value) !== /*item*/ ctx[22].green) {
    				set_input_value(input3, /*item*/ ctx[22].green);
    			}

    			if (dirty & /*$storeFE*/ 8 && to_number(input4.value) !== /*item*/ ctx[22].yellow) {
    				set_input_value(input4, /*item*/ ctx[22].yellow);
    			}

    			if (dirty & /*$storeFE*/ 8 && to_number(input5.value) !== /*item*/ ctx[22].cost) {
    				set_input_value(input5, /*item*/ ctx[22].cost);
    			}

    			const switch_instance_changes = {};
    			if (dirty & /*$storeFE*/ 8) switch_instance_changes.objAttributes = /*item*/ ctx[22];

    			if (switch_value !== (switch_value = Item)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, t6);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(451:2) {#each $storeFE as item}",
    		ctx
    	});

    	return block;
    }

    // (525:1) {#if dpFlag}
    function create_if_block(ctx) {
    	let h3;
    	let t0_value = /*res*/ ctx[2].cost + "";
    	let t0;
    	let t1;
    	let t2_value = /*res*/ ctx[2].r.toFixed(1) + "";
    	let t2;
    	let t3;
    	let t4_value = /*res*/ ctx[2].g.toFixed(1) + "";
    	let t4;
    	let t5;
    	let t6_value = /*res*/ ctx[2].y.toFixed(1) + "";
    	let t6;
    	let t7;
    	let t8;
    	let each_1_anchor;
    	let each_value = /*res*/ ctx[2].menu;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = text("円 赤 ");
    			t2 = text(t2_value);
    			t3 = text("点 緑 ");
    			t4 = text(t4_value);
    			t5 = text("点 黄 ");
    			t6 = text(t6_value);
    			t7 = text("点");
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h3, file, 525, 2, 8890);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    			append_dev(h3, t3);
    			append_dev(h3, t4);
    			append_dev(h3, t5);
    			append_dev(h3, t6);
    			append_dev(h3, t7);
    			insert_dev(target, t8, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*res*/ 4 && t0_value !== (t0_value = /*res*/ ctx[2].cost + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*res*/ 4 && t2_value !== (t2_value = /*res*/ ctx[2].r.toFixed(1) + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*res*/ 4 && t4_value !== (t4_value = /*res*/ ctx[2].g.toFixed(1) + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*res*/ 4 && t6_value !== (t6_value = /*res*/ ctx[2].y.toFixed(1) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*res*/ 4) {
    				each_value = /*res*/ ctx[2].menu;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t8);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(525:1) {#if dpFlag}",
    		ctx
    	});

    	return block;
    }

    // (531:2) {#each res.menu as menu}
    function create_each_block(ctx) {
    	let div;
    	let li;
    	let t0_value = /*menu*/ ctx[19] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(li, file, 532, 4, 9045);
    			attr_dev(div, "class", "res svelte-1fim4ju");
    			add_location(div, file, 531, 3, 9023);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, li);
    			append_dev(li, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*res*/ 4 && t0_value !== (t0_value = /*menu*/ ctx[19] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(531:2) {#each res.menu as menu}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let h1;
    	let t1;
    	let h30;
    	let t3;
    	let hr0;
    	let t4;
    	let div0;
    	let h20;
    	let t6;
    	let h21;
    	let t8;
    	let ul;
    	let t9;
    	let h31;
    	let strong;
    	let t11;
    	let t12_value = /*$sum*/ ctx[4].cost + "";
    	let t12;
    	let t13;
    	let t14_value = /*$sum*/ ctx[4].red.toFixed(1) + "";
    	let t14;
    	let t15;
    	let t16_value = /*$sum*/ ctx[4].green.toFixed(1) + "";
    	let t16;
    	let t17;
    	let t18_value = /*$sum*/ ctx[4].yellow.toFixed(1) + "";
    	let t18;
    	let t19;
    	let t20;
    	let button0;
    	let t22;
    	let hr1;
    	let t23;
    	let div1;
    	let h22;
    	let t25;
    	let h32;
    	let t27;
    	let input0;
    	let t28;
    	let input1;
    	let t29;
    	let input2;
    	let t30;
    	let button1;
    	let t32;
    	let br;
    	let t33;
    	let t34;
    	let hr2;
    	let t35;
    	let div2;
    	let h23;
    	let t37;
    	let h33;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*$storeFE*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = /*dpFlag*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "生協食堂シミュレータ(β)";
    			t1 = space();
    			h30 = element("h3");
    			h30.textContent = "最終更新 2023/01/05";
    			t3 = space();
    			hr0 = element("hr");
    			t4 = space();
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "@館下食堂";
    			t6 = space();
    			h21 = element("h2");
    			h21.textContent = "選択した商品の合計点数と値段を表示します";
    			t8 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			h31 = element("h3");
    			strong = element("strong");
    			strong.textContent = "合計金額";
    			t11 = space();
    			t12 = text(t12_value);
    			t13 = text("円 赤 ");
    			t14 = text(t14_value);
    			t15 = text("点 緑 ");
    			t16 = text(t16_value);
    			t17 = text("点 黄 ");
    			t18 = text(t18_value);
    			t19 = text("点");
    			t20 = space();
    			button0 = element("button");
    			button0.textContent = "商品を追加する";
    			t22 = space();
    			hr1 = element("hr");
    			t23 = space();
    			div1 = element("div");
    			h22 = element("h2");
    			h22.textContent = "最適点数計算";
    			t25 = space();
    			h32 = element("h3");
    			h32.textContent = "下記の点数を最も安く摂取する組み合わせを計算します．(赤:10点,緑:5点,黄:10点までしか対応していません)";
    			t27 = text("\n\t赤");
    			input0 = element("input");
    			t28 = text("\n\t緑\n\t");
    			input1 = element("input");
    			t29 = text("\n\t黄\n\t");
    			input2 = element("input");
    			t30 = space();
    			button1 = element("button");
    			button1.textContent = "計算";
    			t32 = space();
    			br = element("br");
    			t33 = space();
    			if (if_block) if_block.c();
    			t34 = space();
    			hr2 = element("hr");
    			t35 = space();
    			div2 = element("div");
    			h23 = element("h2");
    			h23.textContent = "生協食堂ガチャ";
    			t37 = space();
    			h33 = element("h3");
    			h33.textContent = "指定した金額分ランダムなメニューを提示します．";
    			add_location(h1, file, 443, 0, 7432);
    			add_location(h30, file, 444, 0, 7455);
    			add_location(hr0, file, 445, 0, 7480);
    			add_location(h20, file, 447, 1, 7508);
    			add_location(h21, file, 448, 1, 7524);
    			add_location(ul, file, 449, 1, 7555);
    			add_location(strong, file, 485, 2, 8231);
    			attr_dev(h31, "class", "svelte-1fim4ju");
    			add_location(h31, file, 484, 1, 8224);
    			add_location(button0, file, 490, 1, 8363);
    			attr_dev(div0, "class", "items svelte-1fim4ju");
    			add_location(div0, file, 446, 0, 7487);
    			add_location(hr1, file, 493, 0, 8415);
    			add_location(h22, file, 495, 1, 8446);
    			add_location(h32, file, 496, 1, 8463);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "step", "0.1");
    			attr_dev(input0, "max", "10");
    			attr_dev(input0, "class", "red svelte-1fim4ju");
    			add_location(input0, file, 499, 2, 8536);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "step", "0.1");
    			attr_dev(input1, "max", "10");
    			attr_dev(input1, "class", "green svelte-1fim4ju");
    			add_location(input1, file, 507, 1, 8630);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "step", "0.1");
    			attr_dev(input2, "max", "10");
    			attr_dev(input2, "class", "yellow svelte-1fim4ju");
    			add_location(input2, file, 515, 1, 8728);
    			add_location(button1, file, 522, 1, 8825);
    			add_location(br, file, 523, 1, 8867);
    			attr_dev(div1, "class", "optimize");
    			add_location(div1, file, 494, 0, 8422);
    			add_location(hr2, file, 537, 0, 9095);
    			add_location(h23, file, 539, 1, 9123);
    			add_location(h33, file, 540, 1, 9141);
    			attr_dev(div2, "class", "gacha");
    			add_location(div2, file, 538, 0, 9102);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, hr0, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h20);
    			append_dev(div0, t6);
    			append_dev(div0, h21);
    			append_dev(div0, t8);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div0, t9);
    			append_dev(div0, h31);
    			append_dev(h31, strong);
    			append_dev(h31, t11);
    			append_dev(h31, t12);
    			append_dev(h31, t13);
    			append_dev(h31, t14);
    			append_dev(h31, t15);
    			append_dev(h31, t16);
    			append_dev(h31, t17);
    			append_dev(h31, t18);
    			append_dev(h31, t19);
    			append_dev(div0, t20);
    			append_dev(div0, button0);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, hr1, anchor);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h22);
    			append_dev(div1, t25);
    			append_dev(div1, h32);
    			append_dev(div1, t27);
    			append_dev(div1, input0);
    			set_input_value(input0, /*score*/ ctx[0].red);
    			append_dev(div1, t28);
    			append_dev(div1, input1);
    			set_input_value(input1, /*score*/ ctx[0].green);
    			append_dev(div1, t29);
    			append_dev(div1, input2);
    			set_input_value(input2, /*score*/ ctx[0].yellow);
    			append_dev(div1, t30);
    			append_dev(div1, button1);
    			append_dev(div1, t32);
    			append_dev(div1, br);
    			append_dev(div1, t33);
    			if (if_block) if_block.m(div1, null);
    			insert_dev(target, t34, anchor);
    			insert_dev(target, hr2, anchor);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h23);
    			append_dev(div2, t37);
    			append_dev(div2, h33);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*addItem*/ ctx[5], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[14]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[15]),
    					listen_dev(input2, "input", /*input2_input_handler_1*/ ctx[16]),
    					listen_dev(button1, "click", /*calcScore*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*changeSum, Item, $storeFE*/ 72) {
    				each_value_1 = /*$storeFE*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if ((!current || dirty & /*$sum*/ 16) && t12_value !== (t12_value = /*$sum*/ ctx[4].cost + "")) set_data_dev(t12, t12_value);
    			if ((!current || dirty & /*$sum*/ 16) && t14_value !== (t14_value = /*$sum*/ ctx[4].red.toFixed(1) + "")) set_data_dev(t14, t14_value);
    			if ((!current || dirty & /*$sum*/ 16) && t16_value !== (t16_value = /*$sum*/ ctx[4].green.toFixed(1) + "")) set_data_dev(t16, t16_value);
    			if ((!current || dirty & /*$sum*/ 16) && t18_value !== (t18_value = /*$sum*/ ctx[4].yellow.toFixed(1) + "")) set_data_dev(t18, t18_value);

    			if (dirty & /*score*/ 1 && to_number(input0.value) !== /*score*/ ctx[0].red) {
    				set_input_value(input0, /*score*/ ctx[0].red);
    			}

    			if (dirty & /*score*/ 1 && to_number(input1.value) !== /*score*/ ctx[0].green) {
    				set_input_value(input1, /*score*/ ctx[0].green);
    			}

    			if (dirty & /*score*/ 1 && to_number(input2.value) !== /*score*/ ctx[0].yellow) {
    				set_input_value(input2, /*score*/ ctx[0].yellow);
    			}

    			if (/*dpFlag*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(hr0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(hr1);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(hr2);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $storeFE;
    	let $sum;
    	let $idIncrement;
    	validate_store(storeFE, 'storeFE');
    	component_subscribe($$self, storeFE, $$value => $$invalidate(3, $storeFE = $$value));
    	validate_store(sum, 'sum');
    	component_subscribe($$self, sum, $$value => $$invalidate(4, $sum = $$value));
    	validate_store(idIncrement, 'idIncrement');
    	component_subscribe($$self, idIncrement, $$value => $$invalidate(18, $idIncrement = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	set_store_value(
    		storeFE,
    		$storeFE = [
    			{
    				selected: false,
    				id: 0,
    				name: "ローストンカツおろしソース",
    				red: 1.8,
    				green: 0.1,
    				yellow: 3.3,
    				cost: 308
    			},
    			{
    				selected: false,
    				id: 1,
    				name: "チキンカツ柚子胡椒マヨ",
    				red: 1.3,
    				green: 0.1,
    				yellow: 4.0,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 2,
    				name: "ハンバーグトマトソース",
    				red: 1.5,
    				green: 0.2,
    				yellow: 1.1,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 3,
    				name: "豚ブロッコリー和風炒め",
    				red: 1.4,
    				green: 0.8,
    				yellow: 1.4,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 4,
    				name: "ビーフシチュー",
    				red: 1.9,
    				green: 1.2,
    				yellow: 0.8,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 5,
    				name: "ししゃもフライ",
    				red: 0.7,
    				green: 0.0,
    				yellow: 1.0,
    				cost: 176
    			},
    			{
    				selected: false,
    				id: 6,
    				name: "鯖味噌煮",
    				red: 1.8,
    				green: 0.0,
    				yellow: 0.4,
    				cost: 176
    			},
    			{
    				selected: false,
    				id: 7,
    				name: "ジューシー唐揚げ",
    				red: 2.7,
    				green: 0.1,
    				yellow: 2.2,
    				cost: 352
    			},
    			{
    				selected: false,
    				id: 8,
    				name: "ポテト野菜サラダ",
    				red: 0.0,
    				green: 0.6,
    				yellow: 0.6,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 9,
    				name: "鶏きも煮",
    				red: 0.6,
    				green: 0.0,
    				yellow: 0.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 10,
    				name: "オクラ巣ごもり玉子",
    				red: 1.0,
    				green: 0.1,
    				yellow: 0.1,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 11,
    				name: "ほうれん草ひじき和え，，，",
    				red: 0.5,
    				green: 0.1,
    				yellow: 0.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 12,
    				name: "小松菜わさび和え",
    				red: 0.1,
    				green: 0.1,
    				yellow: 0.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 13,
    				name: "マカロニサラダ",
    				red: 0.0,
    				green: 0.0,
    				yellow: 1.7,
    				cost: 66
    			},
    			{
    				selected: false,
    				id: 14,
    				name: "ほうれん草",
    				red: 0.0,
    				green: 0.2,
    				yellow: 0.0,
    				cost: 66
    			},
    			{
    				selected: false,
    				id: 15,
    				name: "納豆",
    				red: 0.7,
    				green: 0.0,
    				yellow: 0.1,
    				cost: 44
    			},
    			{
    				selected: false,
    				id: 16,
    				name: "蒸し鶏ビーンズサラダ",
    				red: 0.6,
    				green: 0.5,
    				yellow: 0.1,
    				cost: 176
    			},
    			{
    				selected: false,
    				id: 17,
    				name: "豚汁",
    				red: 0.6,
    				green: 0.4,
    				yellow: 0.4,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 18,
    				name: "味噌汁",
    				red: 0.4,
    				green: 0.0,
    				yellow: 0.3,
    				cost: 33
    			},
    			{
    				selected: false,
    				id: 19,
    				name: "きつねうどん",
    				red: 0.9,
    				green: 0.0,
    				yellow: 4.6,
    				cost: 297
    			},
    			{
    				selected: false,
    				id: 20,
    				name: "きつねそば",
    				red: 0.9,
    				green: 0.0,
    				yellow: 4.2,
    				cost: 297
    			},
    			{
    				selected: false,
    				id: 21,
    				name: "かけうどん",
    				red: 0.0,
    				green: 0.0,
    				yellow: 4.2,
    				cost: 209
    			},
    			{
    				selected: false,
    				id: 22,
    				name: "かけそば",
    				red: 0.0,
    				green: 0.0,
    				yellow: 3.8,
    				cost: 209
    			},
    			{
    				selected: false,
    				id: 23,
    				name: "豚骨ラーメン",
    				red: 0.6,
    				green: 0.1,
    				yellow: 5.3,
    				cost: 385
    			},
    			{
    				selected: false,
    				id: 24,
    				name: "サーモンサラダ丼",
    				red: 0.5,
    				green: 0.1,
    				yellow: 6.4,
    				cost: 462
    			},
    			{
    				selected: false,
    				id: 25,
    				name: "ロースカツカレー",
    				red: 1.6,
    				green: 0.3,
    				yellow: 9.1,
    				cost: 407
    			},
    			{
    				selected: false,
    				id: 26,
    				name: "カレーライス",
    				red: 0.2,
    				green: 0.3,
    				yellow: 7.0,
    				cost: 308
    			},
    			{
    				selected: false,
    				id: 27,
    				name: "焼きプリンタルト",
    				red: 0.0,
    				green: 0.0,
    				yellow: 1.5,
    				cost: 66
    			},
    			{
    				selected: false,
    				id: 28,
    				name: "ベルギーワッフル",
    				red: 0.0,
    				green: 0.0,
    				yellow: 3.5,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 29,
    				name: "大学芋",
    				red: 0.0,
    				green: 0.8,
    				yellow: 1.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 30,
    				name: "牛乳",
    				red: 1.7,
    				green: 0.0,
    				yellow: 0.0,
    				cost: 85
    			},
    			{
    				selected: false,
    				id: 31,
    				name: "あまおうレアチーズケーキ",
    				red: 0.0,
    				green: 0.0,
    				yellow: 1.4,
    				cost: 220
    			},
    			{
    				selected: false,
    				id: 32,
    				name: "大学生協コーヒー",
    				red: 1.2,
    				green: 0.0,
    				yellow: 0.6,
    				cost: 95
    			}
    		],
    		$storeFE
    	);

    	idIncrement.set($storeFE.length);

    	function addItem() {
    		var l = $storeFE.length;

    		set_store_value(
    			storeFE,
    			$storeFE[l] = {
    				selected: false,
    				id: $idIncrement,
    				name: "",
    				red: 0.0,
    				green: 0.0,
    				yellow: 0.0,
    				cost: 0
    			},
    			$storeFE
    		);

    		set_store_value(idIncrement, $idIncrement++, $idIncrement);
    	}

    	set_store_value(
    		sum,
    		$sum = {
    			cost: 0,
    			red: 0.0,
    			green: 0.0,
    			yellow: 0.0
    		},
    		$sum
    	);

    	function changeSum() {
    		set_store_value(sum, $sum.cost = 0, $sum);
    		set_store_value(sum, $sum.red = 0.0, $sum);
    		set_store_value(sum, $sum.green = 0.0, $sum);
    		set_store_value(sum, $sum.yellow = 0.0, $sum);

    		$storeFE.forEach(item => {
    			if (item.selected) {
    				set_store_value(sum, $sum.cost += item.cost, $sum);
    				set_store_value(sum, $sum.red += item.red, $sum);
    				set_store_value(sum, $sum.green += item.green, $sum);
    				set_store_value(sum, $sum.yellow += item.yellow, $sum);
    			}
    		});
    	}

    	let score = {
    		cost: 0,
    		red: 2.0,
    		green: 1.0,
    		yellow: 5.0
    	};

    	let dpFlag = false;
    	let res = { r: 0, g: 0, y: 0, cost: 0, menu: [] };
    	let dp = [];

    	function calcScore() {
    		let len = $storeFE.length;
    		let r = Math.round(Math.min(score.red, 10.0) * 10);
    		let g = Math.round(Math.min(score.green, 5.0) * 10);
    		let y = Math.round(Math.min(score.yellow, 10.0) * 10);
    		let INF = 100000;
    		dp = [...Array(len + 1)].map(k => [...Array(r + 1)].map(k => [...Array(g + 1)].map(k => [...Array(y + 1)].map(k => INF))));
    		dp[0][0][0][0] = 0;

    		for (let i = 1; i <= len; i++) {
    			let cur = {
    				c: $storeFE[i - 1].cost,
    				r: Math.round($storeFE[i - 1].red * 10),
    				g: Math.round($storeFE[i - 1].green * 10),
    				y: Math.round($storeFE[i - 1].yellow * 10)
    			};

    			for (let j = 0; j <= r; j++) {
    				for (let k = 0; k <= g; k++) {
    					for (let l = 0; l <= y; l++) {
    						dp[i][j][k][l] = Math.min(dp[i][j][k][l], dp[i - 1][j][k][l]);
    						let J = Math.min(r, j + cur.r);
    						let K = Math.min(g, k + cur.g);
    						let L = Math.min(y, l + cur.y);
    						dp[i][J][K][L] = Math.min(dp[i][J][K][L], dp[i - 1][J][K][L], dp[i - 1][j][k][l] + cur.c);
    					}
    				}
    			}

    			for (let j = r; j >= 0; j--) {
    				for (let k = g; k >= 0; k--) {
    					for (let l = y; l >= 0; l--) {
    						if (j != r) dp[i][j][k][l] = Math.min(dp[i][j][k][l], dp[i][j + 1][k][l]);
    						if (k != g) dp[i][j][k][l] = Math.min(dp[i][j][k][l], dp[i][j][k + 1][l]);
    						if (l != y) dp[i][j][k][l] = Math.min(dp[i][j][k][l], dp[i][j][k][l + 1]);
    					}
    				}
    			}
    		}

    		$$invalidate(2, res.cost = dp[len][r][g][y], res);
    		$$invalidate(1, dpFlag = true);
    		let tmp = { r, g, y, c: res.cost };
    		$$invalidate(2, res.r = $$invalidate(2, res.g = $$invalidate(2, res.y = 0, res), res), res);
    		$$invalidate(2, res.menu = [], res);

    		for (let i = len; i >= 1; i--) {
    			let cur = {
    				m: $storeFE[i - 1].name,
    				c: $storeFE[i - 1].cost,
    				r: Math.round($storeFE[i - 1].red * 10),
    				g: Math.round($storeFE[i - 1].green * 10),
    				y: Math.round($storeFE[i - 1].yellow * 10)
    			};

    			let isFound = false;

    			for (let j = r; j >= 0; j--) {
    				for (let k = g; k >= 0; k--) {
    					for (let l = y; l >= 0; l--) {
    						let J = Math.min(r, j + cur.r);
    						let K = Math.min(g, k + cur.g);
    						let L = Math.min(y, l + cur.y);

    						if (dp[i - 1][j][k][l] + cur.c === tmp.c && J === tmp.r && K === tmp.g && L === tmp.y) {
    							console.log(i, j, k, l);
    							console.log(tmp);
    							res.menu.push(cur.m);
    							$$invalidate(2, res.r += cur.r / 10, res);
    							$$invalidate(2, res.g += cur.g / 10, res);
    							$$invalidate(2, res.y += cur.y / 10, res);
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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler(each_value_1, item_index) {
    		each_value_1[item_index].selected = this.checked;
    		storeFE.set($storeFE);
    	}

    	function input1_input_handler(each_value_1, item_index) {
    		each_value_1[item_index].name = this.value;
    		storeFE.set($storeFE);
    	}

    	function input2_input_handler(each_value_1, item_index) {
    		each_value_1[item_index].red = to_number(this.value);
    		storeFE.set($storeFE);
    	}

    	function input3_input_handler(each_value_1, item_index) {
    		each_value_1[item_index].green = to_number(this.value);
    		storeFE.set($storeFE);
    	}

    	function input4_input_handler(each_value_1, item_index) {
    		each_value_1[item_index].yellow = to_number(this.value);
    		storeFE.set($storeFE);
    	}

    	function input5_input_handler(each_value_1, item_index) {
    		each_value_1[item_index].cost = to_number(this.value);
    		storeFE.set($storeFE);
    	}

    	function input0_input_handler() {
    		score.red = to_number(this.value);
    		$$invalidate(0, score);
    	}

    	function input1_input_handler_1() {
    		score.green = to_number(this.value);
    		$$invalidate(0, score);
    	}

    	function input2_input_handler_1() {
    		score.yellow = to_number(this.value);
    		$$invalidate(0, score);
    	}

    	$$self.$capture_state = () => ({
    		Item,
    		storeFE,
    		idIncrement,
    		sum,
    		addItem,
    		changeSum,
    		score,
    		dpFlag,
    		res,
    		dp,
    		calcScore,
    		$storeFE,
    		$sum,
    		$idIncrement
    	});

    	$$self.$inject_state = $$props => {
    		if ('score' in $$props) $$invalidate(0, score = $$props.score);
    		if ('dpFlag' in $$props) $$invalidate(1, dpFlag = $$props.dpFlag);
    		if ('res' in $$props) $$invalidate(2, res = $$props.res);
    		if ('dp' in $$props) dp = $$props.dp;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		score,
    		dpFlag,
    		res,
    		$storeFE,
    		$sum,
    		addItem,
    		changeSum,
    		calcScore,
    		input0_change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input0_input_handler,
    		input1_input_handler_1,
    		input2_input_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
