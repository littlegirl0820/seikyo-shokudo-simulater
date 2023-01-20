
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
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
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

    let menuKanshita = writable({});
    let menuFamiru = writable({});
    let menuKasane = writable({});
    let menuRainbow = writable({});
    let idIncrement = writable({});
    let sum = writable({});

    /* src\optimize.svelte generated by Svelte v3.54.0 */

    const file$4 = "src\\optimize.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (143:4) {#if dpFlag}
    function create_if_block$3(ctx) {
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
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
    			add_location(h3, file$4, 143, 8, 4958);
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
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(143:4) {#if dpFlag}",
    		ctx
    	});

    	return block;
    }

    // (149:8) {#each res.menu as menu}
    function create_each_block$2(ctx) {
    	let div;
    	let li;
    	let t0_value = /*menu*/ ctx[9] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(li, file$4, 150, 16, 5176);
    			attr_dev(div, "class", "res svelte-1y1c0s");
    			add_location(div, file$4, 149, 12, 5142);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, li);
    			append_dev(li, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*res*/ 4 && t0_value !== (t0_value = /*menu*/ ctx[9] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(149:8) {#each res.menu as menu}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let h3;
    	let t3;
    	let input0;
    	let t4;
    	let input1;
    	let t5;
    	let input2;
    	let t6;
    	let button;
    	let t8;
    	let br;
    	let t9;
    	let mounted;
    	let dispose;
    	let if_block = /*dpFlag*/ ctx[1] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "最適点数計算";
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "下記の点数を最も安く摂取する組み合わせを計算します．(赤:10点,緑:5点,黄:10点までしか対応していません)";
    			t3 = text("\n    赤");
    			input0 = element("input");
    			t4 = text("\n    緑\n    ");
    			input1 = element("input");
    			t5 = text("\n    黄\n    ");
    			input2 = element("input");
    			t6 = space();
    			button = element("button");
    			button.textContent = "計算";
    			t8 = space();
    			br = element("br");
    			t9 = space();
    			if (if_block) if_block.c();
    			add_location(h2, file$4, 113, 4, 4373);
    			add_location(h3, file$4, 114, 4, 4393);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "step", "0.1");
    			attr_dev(input0, "max", "10");
    			attr_dev(input0, "class", "red svelte-1y1c0s");
    			add_location(input0, file$4, 117, 5, 4478);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "step", "0.1");
    			attr_dev(input1, "max", "10");
    			attr_dev(input1, "class", "green svelte-1y1c0s");
    			add_location(input1, file$4, 125, 4, 4611);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "step", "0.1");
    			attr_dev(input2, "max", "10");
    			attr_dev(input2, "class", "yellow svelte-1y1c0s");
    			add_location(input2, file$4, 133, 4, 4748);
    			add_location(button, file$4, 140, 4, 4881);
    			add_location(br, file$4, 141, 4, 4926);
    			attr_dev(div, "class", "optimize");
    			add_location(div, file$4, 112, 0, 4346);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, h3);
    			append_dev(div, t3);
    			append_dev(div, input0);
    			set_input_value(input0, /*score*/ ctx[0].red);
    			append_dev(div, t4);
    			append_dev(div, input1);
    			set_input_value(input1, /*score*/ ctx[0].green);
    			append_dev(div, t5);
    			append_dev(div, input2);
    			set_input_value(input2, /*score*/ ctx[0].yellow);
    			append_dev(div, t6);
    			append_dev(div, button);
    			append_dev(div, t8);
    			append_dev(div, br);
    			append_dev(div, t9);
    			if (if_block) if_block.m(div, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(button, "click", /*calcScore*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
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
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Optimize', slots, []);

    	let score = {
    		cost: 0,
    		red: 2.0,
    		green: 1.0,
    		yellow: 5.0
    	};

    	let dpFlag = false;
    	let res = { r: 0, g: 0, y: 0, cost: 0, menu: [] };
    	let dp = [];
    	let { menuList = [] } = $$props;

    	function calcScore() {
    		let len = menuList.length;
    		let r = Math.round(Math.min(score.red, 10.0) * 10);
    		let g = Math.round(Math.min(score.green, 5.0) * 10);
    		let y = Math.round(Math.min(score.yellow, 10.0) * 10);
    		let INF = 100000;
    		dp = [...Array(len + 1)].map(k => [...Array(r + 1)].map(k => [...Array(g + 1)].map(k => [...Array(y + 1)].map(k => INF))));
    		dp[0][0][0][0] = 0;

    		for (let i = 1; i <= len; i++) {
    			let cur = {
    				c: menuList[i - 1].cost,
    				r: Math.round(menuList[i - 1].red * 10),
    				g: Math.round(menuList[i - 1].green * 10),
    				y: Math.round(menuList[i - 1].yellow * 10)
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
    				m: menuList[i - 1].name,
    				c: menuList[i - 1].cost,
    				r: Math.round(menuList[i - 1].red * 10),
    				g: Math.round(menuList[i - 1].green * 10),
    				y: Math.round(menuList[i - 1].yellow * 10)
    			};

    			let isFound = false;

    			for (let j = r; j >= 0; j--) {
    				for (let k = g; k >= 0; k--) {
    					for (let l = y; l >= 0; l--) {
    						let J = Math.min(r, j + cur.r);
    						let K = Math.min(g, k + cur.g);
    						let L = Math.min(y, l + cur.y);

    						if (dp[i - 1][j][k][l] + cur.c === tmp.c && J === tmp.r && K === tmp.g && L === tmp.y) {
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

    	const writable_props = ['menuList'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Optimize> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		score.red = to_number(this.value);
    		$$invalidate(0, score);
    	}

    	function input1_input_handler() {
    		score.green = to_number(this.value);
    		$$invalidate(0, score);
    	}

    	function input2_input_handler() {
    		score.yellow = to_number(this.value);
    		$$invalidate(0, score);
    	}

    	$$self.$$set = $$props => {
    		if ('menuList' in $$props) $$invalidate(4, menuList = $$props.menuList);
    	};

    	$$self.$capture_state = () => ({
    		score,
    		dpFlag,
    		res,
    		dp,
    		menuList,
    		calcScore
    	});

    	$$self.$inject_state = $$props => {
    		if ('score' in $$props) $$invalidate(0, score = $$props.score);
    		if ('dpFlag' in $$props) $$invalidate(1, dpFlag = $$props.dpFlag);
    		if ('res' in $$props) $$invalidate(2, res = $$props.res);
    		if ('dp' in $$props) dp = $$props.dp;
    		if ('menuList' in $$props) $$invalidate(4, menuList = $$props.menuList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		score,
    		dpFlag,
    		res,
    		calcScore,
    		menuList,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class Optimize extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { menuList: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Optimize",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get menuList() {
    		throw new Error("<Optimize>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set menuList(value) {
    		throw new Error("<Optimize>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\item.svelte generated by Svelte v3.54.0 */
    const file$3 = "src\\item.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let br;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "削除";
    			br = element("br");
    			add_location(button, file$3, 41, 0, 1371);
    			add_location(br, file$3, 41, 46, 1417);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $sum;
    	let $menuFamiru;
    	let $menuKanshita;
    	validate_store(sum, 'sum');
    	component_subscribe($$self, sum, $$value => $$invalidate(3, $sum = $$value));
    	validate_store(menuFamiru, 'menuFamiru');
    	component_subscribe($$self, menuFamiru, $$value => $$invalidate(4, $menuFamiru = $$value));
    	validate_store(menuKanshita, 'menuKanshita');
    	component_subscribe($$self, menuKanshita, $$value => $$invalidate(5, $menuKanshita = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Item', slots, []);
    	let { objAttributes = {} } = $$props;
    	let { state = 0 } = $$props;

    	function removeComponent() {
    		if (state === 0) {
    			set_store_value(
    				menuKanshita,
    				$menuKanshita = $menuKanshita.filter(function (value) {
    					if (value.id != objAttributes.id) return value;
    				}),
    				$menuKanshita
    			);

    			set_store_value(sum, $sum.cost = 0, $sum);
    			set_store_value(sum, $sum.red = 0.0, $sum);
    			set_store_value(sum, $sum.green = 0.0, $sum);
    			set_store_value(sum, $sum.yellow = 0.0, $sum);

    			$menuKanshita.forEach(item => {
    				if (item.selected) {
    					set_store_value(sum, $sum.cost += item.cost, $sum);
    					set_store_value(sum, $sum.red += item.red, $sum);
    					set_store_value(sum, $sum.green += item.green, $sum);
    					set_store_value(sum, $sum.yellow += item.yellow, $sum);
    				}
    			});
    		} else if (state === 1) {
    			set_store_value(
    				menuFamiru,
    				$menuFamiru = $menuFamiru.filter(function (value) {
    					if (value.id != objAttributes.id) return value;
    				}),
    				$menuFamiru
    			);

    			set_store_value(sum, $sum.cost = 0, $sum);
    			set_store_value(sum, $sum.red = 0.0, $sum);
    			set_store_value(sum, $sum.green = 0.0, $sum);
    			set_store_value(sum, $sum.yellow = 0.0, $sum);

    			$menuFamiru.forEach(item => {
    				if (item.selected) {
    					set_store_value(sum, $sum.cost += item.cost, $sum);
    					set_store_value(sum, $sum.red += item.red, $sum);
    					set_store_value(sum, $sum.green += item.green, $sum);
    					set_store_value(sum, $sum.yellow += item.yellow, $sum);
    				}
    			});
    		}
    	}

    	const writable_props = ['objAttributes', 'state'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('objAttributes' in $$props) $$invalidate(1, objAttributes = $$props.objAttributes);
    		if ('state' in $$props) $$invalidate(2, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		menuKanshita,
    		menuFamiru,
    		sum,
    		objAttributes,
    		state,
    		removeComponent,
    		$sum,
    		$menuFamiru,
    		$menuKanshita
    	});

    	$$self.$inject_state = $$props => {
    		if ('objAttributes' in $$props) $$invalidate(1, objAttributes = $$props.objAttributes);
    		if ('state' in $$props) $$invalidate(2, state = $$props.state);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [removeComponent, objAttributes, state];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { objAttributes: 1, state: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get objAttributes() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set objAttributes(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\menu.svelte generated by Svelte v3.54.0 */
    const file$2 = "src\\menu.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[13] = list;
    	child_ctx[14] = i;
    	return child_ctx;
    }

    // (43:30) 
    function create_if_block_3$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("@レインボー");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(43:30) ",
    		ctx
    	});

    	return block;
    }

    // (41:30) 
    function create_if_block_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("@かさね");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(41:30) ",
    		ctx
    	});

    	return block;
    }

    // (39:30) 
    function create_if_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("@ファミール");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(39:30) ",
    		ctx
    	});

    	return block;
    }

    // (37:8) {#if state === 0}
    function create_if_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("@館下食堂");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(37:8) {#if state === 0}",
    		ctx
    	});

    	return block;
    }

    // (56:8) {#each menuList as item}
    function create_each_block$1(ctx) {
    	let div;
    	let li;
    	let input0;
    	let t0;
    	let input1;
    	let t1;
    	let br0;
    	let t2;
    	let input2;
    	let t3;
    	let input3;
    	let t4;
    	let input4;
    	let t5;
    	let br1;
    	let t6;
    	let input5;
    	let t7;
    	let switch_instance;
    	let t8;
    	let current;
    	let mounted;
    	let dispose;

    	function input0_change_handler() {
    		/*input0_change_handler*/ ctx[5].call(input0, /*each_value*/ ctx[13], /*item_index*/ ctx[14]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[6].call(input1, /*each_value*/ ctx[13], /*item_index*/ ctx[14]);
    	}

    	function input2_input_handler() {
    		/*input2_input_handler*/ ctx[7].call(input2, /*each_value*/ ctx[13], /*item_index*/ ctx[14]);
    	}

    	function input3_input_handler() {
    		/*input3_input_handler*/ ctx[8].call(input3, /*each_value*/ ctx[13], /*item_index*/ ctx[14]);
    	}

    	function input4_input_handler() {
    		/*input4_input_handler*/ ctx[9].call(input4, /*each_value*/ ctx[13], /*item_index*/ ctx[14]);
    	}

    	function input5_input_handler() {
    		/*input5_input_handler*/ ctx[10].call(input5, /*each_value*/ ctx[13], /*item_index*/ ctx[14]);
    	}

    	var switch_value = Item;

    	function switch_props(ctx) {
    		return {
    			props: {
    				objAttributes: /*item*/ ctx[12],
    				state: /*state*/ ctx[1]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			li = element("li");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			br0 = element("br");
    			t2 = text("\n                    赤\n                    ");
    			input2 = element("input");
    			t3 = text("\n                    緑\n                    ");
    			input3 = element("input");
    			t4 = text("\n                    黄\n                    ");
    			input4 = element("input");
    			t5 = space();
    			br1 = element("br");
    			t6 = text("\n                    値段 ");
    			input5 = element("input");
    			t7 = text("円\n                    ");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t8 = space();
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$2, 58, 20, 1425);
    			attr_dev(input1, "placeholder", "商品名");
    			attr_dev(input1, "class", "item svelte-1dai3v4");
    			add_location(input1, file$2, 59, 20, 1500);
    			add_location(br0, file$2, 64, 20, 1676);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "step", "0.1");
    			attr_dev(input2, "class", "red svelte-1dai3v4");
    			add_location(input2, file$2, 66, 20, 1725);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "step", "0.1");
    			attr_dev(input3, "class", "green svelte-1dai3v4");
    			add_location(input3, file$2, 73, 20, 1952);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "step", "0.1");
    			attr_dev(input4, "class", "yellow svelte-1dai3v4");
    			add_location(input4, file$2, 80, 20, 2183);
    			add_location(br1, file$2, 86, 20, 2394);
    			attr_dev(input5, "type", "number");
    			attr_dev(input5, "class", "svelte-1dai3v4");
    			add_location(input5, file$2, 87, 23, 2424);
    			attr_dev(li, "class", "svelte-1dai3v4");
    			add_location(li, file$2, 57, 16, 1400);
    			add_location(div, file$2, 56, 12, 1356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, li);
    			append_dev(li, input0);
    			input0.checked = /*item*/ ctx[12].selected;
    			append_dev(li, t0);
    			append_dev(li, input1);
    			set_input_value(input1, /*item*/ ctx[12].name);
    			append_dev(li, t1);
    			append_dev(li, br0);
    			append_dev(li, t2);
    			append_dev(li, input2);
    			set_input_value(input2, /*item*/ ctx[12].red);
    			append_dev(li, t3);
    			append_dev(li, input3);
    			set_input_value(input3, /*item*/ ctx[12].green);
    			append_dev(li, t4);
    			append_dev(li, input4);
    			set_input_value(input4, /*item*/ ctx[12].yellow);
    			append_dev(li, t5);
    			append_dev(li, br1);
    			append_dev(li, t6);
    			append_dev(li, input5);
    			set_input_value(input5, /*item*/ ctx[12].cost);
    			append_dev(li, t7);
    			if (switch_instance) mount_component(switch_instance, li, null);
    			append_dev(div, t8);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", input0_change_handler),
    					listen_dev(input1, "input", input1_input_handler),
    					listen_dev(input2, "input", input2_input_handler),
    					listen_dev(input3, "input", input3_input_handler),
    					listen_dev(input4, "input", input4_input_handler),
    					listen_dev(input5, "input", input5_input_handler),
    					listen_dev(div, "change", /*changeSum*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*menuList*/ 1) {
    				input0.checked = /*item*/ ctx[12].selected;
    			}

    			if (dirty & /*menuList*/ 1 && input1.value !== /*item*/ ctx[12].name) {
    				set_input_value(input1, /*item*/ ctx[12].name);
    			}

    			if (dirty & /*menuList*/ 1 && to_number(input2.value) !== /*item*/ ctx[12].red) {
    				set_input_value(input2, /*item*/ ctx[12].red);
    			}

    			if (dirty & /*menuList*/ 1 && to_number(input3.value) !== /*item*/ ctx[12].green) {
    				set_input_value(input3, /*item*/ ctx[12].green);
    			}

    			if (dirty & /*menuList*/ 1 && to_number(input4.value) !== /*item*/ ctx[12].yellow) {
    				set_input_value(input4, /*item*/ ctx[12].yellow);
    			}

    			if (dirty & /*menuList*/ 1 && to_number(input5.value) !== /*item*/ ctx[12].cost) {
    				set_input_value(input5, /*item*/ ctx[12].cost);
    			}

    			const switch_instance_changes = {};
    			if (dirty & /*menuList*/ 1) switch_instance_changes.objAttributes = /*item*/ ctx[12];
    			if (dirty & /*state*/ 2) switch_instance_changes.state = /*state*/ ctx[1];

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
    					mount_component(switch_instance, li, null);
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(56:8) {#each menuList as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let h20;
    	let t0;
    	let h21;
    	let t2;
    	let label;
    	let t4;
    	let input;
    	let t5;
    	let ul;
    	let t6;
    	let h3;
    	let strong;
    	let t8;
    	let t9_value = /*$sum*/ ctx[2].cost + "";
    	let t9;
    	let t10;
    	let t11_value = /*$sum*/ ctx[2].red.toFixed(1) + "";
    	let t11;
    	let t12;
    	let t13_value = /*$sum*/ ctx[2].green.toFixed(1) + "";
    	let t13;
    	let t14;
    	let t15_value = /*$sum*/ ctx[2].yellow.toFixed(1) + "";
    	let t15;
    	let t16;
    	let t17;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*state*/ ctx[1] === 0) return create_if_block$2;
    		if (/*state*/ ctx[1] === 1) return create_if_block_1$1;
    		if (/*state*/ ctx[1] === 2) return create_if_block_2$1;
    		if (/*state*/ ctx[1] === 3) return create_if_block_3$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);
    	let each_value = /*menuList*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h20 = element("h2");
    			if (if_block) if_block.c();
    			t0 = space();
    			h21 = element("h2");
    			h21.textContent = "選択した商品の合計点数と値段を表示します";
    			t2 = space();
    			label = element("label");
    			label.textContent = "展開";
    			t4 = space();
    			input = element("input");
    			t5 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			h3 = element("h3");
    			strong = element("strong");
    			strong.textContent = "合計金額";
    			t8 = space();
    			t9 = text(t9_value);
    			t10 = text("円 赤 ");
    			t11 = text(t11_value);
    			t12 = text("点 緑 ");
    			t13 = text(t13_value);
    			t14 = text("点 黄 ");
    			t15 = text(t15_value);
    			t16 = text("点");
    			t17 = space();
    			button = element("button");
    			button.textContent = "商品を追加する";
    			add_location(h20, file$2, 35, 4, 878);
    			add_location(h21, file$2, 46, 4, 1103);
    			attr_dev(label, "for", "expansion");
    			attr_dev(label, "class", "svelte-1dai3v4");
    			add_location(label, file$2, 47, 4, 1137);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "expansion");
    			attr_dev(input, "class", "accordion");
    			set_style(input, "display", "none");
    			add_location(input, file$2, 48, 4, 1175);
    			attr_dev(ul, "id", "link");
    			attr_dev(ul, "class", "svelte-1dai3v4");
    			add_location(ul, file$2, 54, 4, 1296);
    			add_location(strong, file$2, 98, 8, 2730);
    			attr_dev(h3, "class", "svelte-1dai3v4");
    			add_location(h3, file$2, 97, 4, 2717);
    			add_location(button, file$2, 103, 4, 2889);
    			attr_dev(div, "class", "items svelte-1dai3v4");
    			add_location(div, file$2, 34, 0, 854);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h20);
    			if (if_block) if_block.m(h20, null);
    			append_dev(div, t0);
    			append_dev(div, h21);
    			append_dev(div, t2);
    			append_dev(div, label);
    			append_dev(div, t4);
    			append_dev(div, input);
    			append_dev(div, t5);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div, t6);
    			append_dev(div, h3);
    			append_dev(h3, strong);
    			append_dev(h3, t8);
    			append_dev(h3, t9);
    			append_dev(h3, t10);
    			append_dev(h3, t11);
    			append_dev(h3, t12);
    			append_dev(h3, t13);
    			append_dev(h3, t14);
    			append_dev(h3, t15);
    			append_dev(h3, t16);
    			append_dev(div, t17);
    			append_dev(div, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*addItem*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(h20, null);
    				}
    			}

    			if (dirty & /*changeSum, Item, menuList, state*/ 19) {
    				each_value = /*menuList*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if ((!current || dirty & /*$sum*/ 4) && t9_value !== (t9_value = /*$sum*/ ctx[2].cost + "")) set_data_dev(t9, t9_value);
    			if ((!current || dirty & /*$sum*/ 4) && t11_value !== (t11_value = /*$sum*/ ctx[2].red.toFixed(1) + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty & /*$sum*/ 4) && t13_value !== (t13_value = /*$sum*/ ctx[2].green.toFixed(1) + "")) set_data_dev(t13, t13_value);
    			if ((!current || dirty & /*$sum*/ 4) && t15_value !== (t15_value = /*$sum*/ ctx[2].yellow.toFixed(1) + "")) set_data_dev(t15, t15_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
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
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}

    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $sum;
    	let $idIncrement;
    	validate_store(sum, 'sum');
    	component_subscribe($$self, sum, $$value => $$invalidate(2, $sum = $$value));
    	validate_store(idIncrement, 'idIncrement');
    	component_subscribe($$self, idIncrement, $$value => $$invalidate(11, $idIncrement = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Menu', slots, []);
    	let { state = 0 } = $$props;
    	let { menuList = [] } = $$props;

    	function addItem() {
    		var l = menuList.length;

    		$$invalidate(
    			0,
    			menuList[l] = {
    				selected: false,
    				id: $idIncrement,
    				name: "",
    				red: 0.0,
    				green: 0.0,
    				yellow: 0.0,
    				cost: 0
    			},
    			menuList
    		);

    		set_store_value(idIncrement, $idIncrement++, $idIncrement);
    	}

    	function changeSum() {
    		set_store_value(sum, $sum.cost = 0, $sum);
    		set_store_value(sum, $sum.red = 0.0, $sum);
    		set_store_value(sum, $sum.green = 0.0, $sum);
    		set_store_value(sum, $sum.yellow = 0.0, $sum);

    		menuList.forEach(item => {
    			if (item.selected) {
    				set_store_value(sum, $sum.cost += item.cost, $sum);
    				set_store_value(sum, $sum.red += item.red, $sum);
    				set_store_value(sum, $sum.green += item.green, $sum);
    				set_store_value(sum, $sum.yellow += item.yellow, $sum);
    			}
    		});
    	}

    	const writable_props = ['state', 'menuList'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler(each_value, item_index) {
    		each_value[item_index].selected = this.checked;
    		$$invalidate(0, menuList);
    	}

    	function input1_input_handler(each_value, item_index) {
    		each_value[item_index].name = this.value;
    		$$invalidate(0, menuList);
    	}

    	function input2_input_handler(each_value, item_index) {
    		each_value[item_index].red = to_number(this.value);
    		$$invalidate(0, menuList);
    	}

    	function input3_input_handler(each_value, item_index) {
    		each_value[item_index].green = to_number(this.value);
    		$$invalidate(0, menuList);
    	}

    	function input4_input_handler(each_value, item_index) {
    		each_value[item_index].yellow = to_number(this.value);
    		$$invalidate(0, menuList);
    	}

    	function input5_input_handler(each_value, item_index) {
    		each_value[item_index].cost = to_number(this.value);
    		$$invalidate(0, menuList);
    	}

    	$$self.$$set = $$props => {
    		if ('state' in $$props) $$invalidate(1, state = $$props.state);
    		if ('menuList' in $$props) $$invalidate(0, menuList = $$props.menuList);
    	};

    	$$self.$capture_state = () => ({
    		idIncrement,
    		sum,
    		Item,
    		state,
    		menuList,
    		addItem,
    		changeSum,
    		$sum,
    		$idIncrement
    	});

    	$$self.$inject_state = $$props => {
    		if ('state' in $$props) $$invalidate(1, state = $$props.state);
    		if ('menuList' in $$props) $$invalidate(0, menuList = $$props.menuList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		menuList,
    		state,
    		$sum,
    		addItem,
    		changeSum,
    		input0_change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler
    	];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { state: 1, menuList: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get state() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get menuList() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set menuList(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\gacha.svelte generated by Svelte v3.54.0 */

    const file$1 = "src\\gacha.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (75:0) {#if isCasted}
    function create_if_block$1(ctx) {
    	let h3;
    	let t0_value = /*res*/ ctx[2].c + "";
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
    	let t9;
    	let a;
    	let t10;
    	let a_href_value;
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

    			t9 = space();
    			a = element("a");
    			t10 = text("ツイートする");
    			add_location(h3, file$1, 75, 4, 1914);
    			attr_dev(a, "href", a_href_value = "https://twitter.com/share?url=https://seikyo-simulater.vercel.app/&text=" + /*tweetText*/ ctx[3]);
    			attr_dev(a, "rel", "noreferrer");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "twitter-share-button svelte-1nxsy32");
    			add_location(a, file$1, 88, 4, 2179);
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

    			insert_dev(target, t9, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t10);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*res*/ 4 && t0_value !== (t0_value = /*res*/ ctx[2].c + "")) set_data_dev(t0, t0_value);
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
    						each_blocks[i].m(t9.parentNode, t9);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*tweetText*/ 8 && a_href_value !== (a_href_value = "https://twitter.com/share?url=https://seikyo-simulater.vercel.app/&text=" + /*tweetText*/ ctx[3])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t8);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(75:0) {#if isCasted}",
    		ctx
    	});

    	return block;
    }

    // (82:4) {#each res.menu as menu}
    function create_each_block(ctx) {
    	let div;
    	let li;
    	let t_value = /*menu*/ ctx[11] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			li = element("li");
    			t = text(t_value);
    			add_location(li, file$1, 83, 12, 2102);
    			attr_dev(div, "class", "res svelte-1nxsy32");
    			add_location(div, file$1, 82, 8, 2072);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, li);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*res*/ 4 && t_value !== (t_value = /*menu*/ ctx[11] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(82:4) {#each res.menu as menu}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h2;
    	let t1;
    	let h30;
    	let t3;
    	let h31;
    	let t5;
    	let input;
    	let t6;
    	let br;
    	let t7;
    	let button0;
    	let t9;
    	let button1;
    	let t11;
    	let button2;
    	let t13;
    	let button3;
    	let t15;
    	let button4;
    	let t17;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let if_block = /*isCasted*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "生協食堂ガチャ";
    			t1 = space();
    			h30 = element("h3");
    			h30.textContent = "指定した金額分ランダムなメニューを提示します．";
    			t3 = space();
    			h31 = element("h3");
    			h31.textContent = "曜日関係なくセットメニューも提示します．";
    			t5 = space();
    			input = element("input");
    			t6 = text("円");
    			br = element("br");
    			t7 = space();
    			button0 = element("button");
    			button0.textContent = "ガチャ！";
    			t9 = space();
    			button1 = element("button");
    			button1.textContent = "550円";
    			t11 = space();
    			button2 = element("button");
    			button2.textContent = "650円";
    			t13 = space();
    			button3 = element("button");
    			button3.textContent = "1000円";
    			t15 = space();
    			button4 = element("button");
    			button4.textContent = "1100円";
    			t17 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h2, file$1, 44, 0, 1346);
    			add_location(h30, file$1, 45, 0, 1363);
    			add_location(h31, file$1, 46, 0, 1396);
    			attr_dev(input, "type", "number");
    			add_location(input, file$1, 47, 0, 1426);
    			add_location(br, file$1, 47, 43, 1469);
    			add_location(button0, file$1, 49, 0, 1477);
    			add_location(button1, file$1, 50, 0, 1519);
    			add_location(button2, file$1, 56, 0, 1612);
    			add_location(button3, file$1, 62, 0, 1705);
    			add_location(button4, file$1, 68, 0, 1800);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*price*/ ctx[0]);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, button3, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, button4, anchor);
    			insert_dev(target, t17, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(button0, "click", /*castLots*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*click_handler*/ ctx[7], false, false, false),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[8], false, false, false),
    					listen_dev(button3, "click", /*click_handler_2*/ ctx[9], false, false, false),
    					listen_dev(button4, "click", /*click_handler_3*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*price*/ 1 && to_number(input.value) !== /*price*/ ctx[0]) {
    				set_input_value(input, /*price*/ ctx[0]);
    			}

    			if (/*isCasted*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(button3);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(button4);
    			if (detaching) detach_dev(t17);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Gacha', slots, []);
    	let price = 550;
    	let isCasted = false;
    	let res = { c: 0, r: 0.0, g: 0.0, y: 0.0, menu: [] };
    	let tweetText = "";
    	let { menuList = [] } = $$props;

    	function castLots() {
    		let len = menuList.length;
    		let seq = [];
    		for (let i = 0; i < len; i++) seq.push(i);
    		let swapNum = 1000;

    		for (let i = 0; i < swapNum; i++) {
    			let l = Math.floor(Math.random() * len), r = Math.floor(Math.random() * len);
    			let tmp = seq[l];
    			seq[l] = seq[r];
    			seq[r] = tmp;
    		}

    		$$invalidate(2, res.c = 0, res);
    		$$invalidate(2, res.r = $$invalidate(2, res.g = $$invalidate(2, res.y = 0.0, res), res), res);
    		$$invalidate(2, res.menu = [], res);
    		let cur = price;

    		for (const x of seq) {
    			if (menuList[x].cost <= cur) {
    				cur -= menuList[x].cost;
    				$$invalidate(2, res.c += menuList[x].cost, res);
    				$$invalidate(2, res.r += menuList[x].red, res);
    				$$invalidate(2, res.g += menuList[x].green, res);
    				$$invalidate(2, res.y += menuList[x].yellow, res);
    				res.menu.push(menuList[x].name);
    			}
    		}

    		$$invalidate(3, tweetText = "生協食堂");
    		$$invalidate(3, tweetText += price);
    		$$invalidate(3, tweetText += "円ガチャで%0D%0A");

    		for (const x of res.menu) {
    			$$invalidate(3, tweetText += "『" + x + "』%0D%0A");
    		}

    		$$invalidate(3, tweetText += "が出ました！%0D%0A");
    		$$invalidate(3, tweetText += "%23生協食堂ガチャ %0D%0A");
    		$$invalidate(1, isCasted = true);
    	}

    	const writable_props = ['menuList'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Gacha> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		price = to_number(this.value);
    		$$invalidate(0, price);
    	}

    	const click_handler = () => {
    		$$invalidate(0, price = 550);
    		castLots();
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, price = 650);
    		castLots();
    	};

    	const click_handler_2 = () => {
    		$$invalidate(0, price = 1000);
    		castLots();
    	};

    	const click_handler_3 = () => {
    		$$invalidate(0, price = 1100);
    		castLots();
    	};

    	$$self.$$set = $$props => {
    		if ('menuList' in $$props) $$invalidate(5, menuList = $$props.menuList);
    	};

    	$$self.$capture_state = () => ({
    		price,
    		isCasted,
    		res,
    		tweetText,
    		menuList,
    		castLots
    	});

    	$$self.$inject_state = $$props => {
    		if ('price' in $$props) $$invalidate(0, price = $$props.price);
    		if ('isCasted' in $$props) $$invalidate(1, isCasted = $$props.isCasted);
    		if ('res' in $$props) $$invalidate(2, res = $$props.res);
    		if ('tweetText' in $$props) $$invalidate(3, tweetText = $$props.tweetText);
    		if ('menuList' in $$props) $$invalidate(5, menuList = $$props.menuList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		price,
    		isCasted,
    		res,
    		tweetText,
    		castLots,
    		menuList,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Gacha extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { menuList: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gacha",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get menuList() {
    		throw new Error("<Gacha>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set menuList(value) {
    		throw new Error("<Gacha>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.54.0 */
    const file = "src\\App.svelte";

    // (1007:22) 
    function create_if_block_3(ctx) {
    	let hr0;
    	let t0;
    	let menu;
    	let t1;
    	let hr1;
    	let t2;
    	let optimize;
    	let t3;
    	let hr2;
    	let t4;
    	let gacha;
    	let t5;
    	let hr3;
    	let current;

    	menu = new Menu({
    			props: {
    				state: /*state*/ ctx[0],
    				menuList: /*$menuRainbow*/ ctx[2]
    			},
    			$$inline: true
    		});

    	optimize = new Optimize({
    			props: { menuList: /*$menuRainbow*/ ctx[2] },
    			$$inline: true
    		});

    	gacha = new Gacha({
    			props: { menuList: /*$menuRainbow*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			hr0 = element("hr");
    			t0 = space();
    			create_component(menu.$$.fragment);
    			t1 = space();
    			hr1 = element("hr");
    			t2 = space();
    			create_component(optimize.$$.fragment);
    			t3 = space();
    			hr2 = element("hr");
    			t4 = space();
    			create_component(gacha.$$.fragment);
    			t5 = space();
    			hr3 = element("hr");
    			add_location(hr0, file, 1007, 1, 13759);
    			add_location(hr1, file, 1009, 1, 13809);
    			add_location(hr2, file, 1011, 1, 13855);
    			add_location(hr3, file, 1013, 1, 13898);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr0, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(menu, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr1, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(optimize, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, hr2, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(gacha, target, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, hr3, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const menu_changes = {};
    			if (dirty & /*state*/ 1) menu_changes.state = /*state*/ ctx[0];
    			if (dirty & /*$menuRainbow*/ 4) menu_changes.menuList = /*$menuRainbow*/ ctx[2];
    			menu.$set(menu_changes);
    			const optimize_changes = {};
    			if (dirty & /*$menuRainbow*/ 4) optimize_changes.menuList = /*$menuRainbow*/ ctx[2];
    			optimize.$set(optimize_changes);
    			const gacha_changes = {};
    			if (dirty & /*$menuRainbow*/ 4) gacha_changes.menuList = /*$menuRainbow*/ ctx[2];
    			gacha.$set(gacha_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			transition_in(optimize.$$.fragment, local);
    			transition_in(gacha.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			transition_out(optimize.$$.fragment, local);
    			transition_out(gacha.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr0);
    			if (detaching) detach_dev(t0);
    			destroy_component(menu, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr1);
    			if (detaching) detach_dev(t2);
    			destroy_component(optimize, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(hr2);
    			if (detaching) detach_dev(t4);
    			destroy_component(gacha, detaching);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(hr3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(1007:22) ",
    		ctx
    	});

    	return block;
    }

    // (999:22) 
    function create_if_block_2(ctx) {
    	let hr0;
    	let t0;
    	let menu;
    	let t1;
    	let hr1;
    	let t2;
    	let optimize;
    	let t3;
    	let hr2;
    	let t4;
    	let gacha;
    	let t5;
    	let hr3;
    	let current;

    	menu = new Menu({
    			props: {
    				state: /*state*/ ctx[0],
    				menuList: /*$menuKasane*/ ctx[3]
    			},
    			$$inline: true
    		});

    	optimize = new Optimize({
    			props: { menuList: /*$menuKasane*/ ctx[3] },
    			$$inline: true
    		});

    	gacha = new Gacha({
    			props: { menuList: /*$menuKasane*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			hr0 = element("hr");
    			t0 = space();
    			create_component(menu.$$.fragment);
    			t1 = space();
    			hr1 = element("hr");
    			t2 = space();
    			create_component(optimize.$$.fragment);
    			t3 = space();
    			hr2 = element("hr");
    			t4 = space();
    			create_component(gacha.$$.fragment);
    			t5 = space();
    			hr3 = element("hr");
    			add_location(hr0, file, 999, 1, 13592);
    			add_location(hr1, file, 1001, 1, 13641);
    			add_location(hr2, file, 1003, 1, 13686);
    			add_location(hr3, file, 1005, 1, 13728);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr0, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(menu, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr1, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(optimize, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, hr2, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(gacha, target, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, hr3, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const menu_changes = {};
    			if (dirty & /*state*/ 1) menu_changes.state = /*state*/ ctx[0];
    			if (dirty & /*$menuKasane*/ 8) menu_changes.menuList = /*$menuKasane*/ ctx[3];
    			menu.$set(menu_changes);
    			const optimize_changes = {};
    			if (dirty & /*$menuKasane*/ 8) optimize_changes.menuList = /*$menuKasane*/ ctx[3];
    			optimize.$set(optimize_changes);
    			const gacha_changes = {};
    			if (dirty & /*$menuKasane*/ 8) gacha_changes.menuList = /*$menuKasane*/ ctx[3];
    			gacha.$set(gacha_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			transition_in(optimize.$$.fragment, local);
    			transition_in(gacha.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			transition_out(optimize.$$.fragment, local);
    			transition_out(gacha.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr0);
    			if (detaching) detach_dev(t0);
    			destroy_component(menu, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr1);
    			if (detaching) detach_dev(t2);
    			destroy_component(optimize, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(hr2);
    			if (detaching) detach_dev(t4);
    			destroy_component(gacha, detaching);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(hr3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(999:22) ",
    		ctx
    	});

    	return block;
    }

    // (991:22) 
    function create_if_block_1(ctx) {
    	let hr0;
    	let t0;
    	let menu;
    	let t1;
    	let hr1;
    	let t2;
    	let optimize;
    	let t3;
    	let hr2;
    	let t4;
    	let gacha;
    	let t5;
    	let hr3;
    	let current;

    	menu = new Menu({
    			props: {
    				state: /*state*/ ctx[0],
    				menuList: /*$menuFamiru*/ ctx[4]
    			},
    			$$inline: true
    		});

    	optimize = new Optimize({
    			props: { menuList: /*$menuFamiru*/ ctx[4] },
    			$$inline: true
    		});

    	gacha = new Gacha({
    			props: { menuList: /*$menuFamiru*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			hr0 = element("hr");
    			t0 = space();
    			create_component(menu.$$.fragment);
    			t1 = space();
    			hr1 = element("hr");
    			t2 = space();
    			create_component(optimize.$$.fragment);
    			t3 = space();
    			hr2 = element("hr");
    			t4 = space();
    			create_component(gacha.$$.fragment);
    			t5 = space();
    			hr3 = element("hr");
    			add_location(hr0, file, 991, 1, 13425);
    			add_location(hr1, file, 993, 1, 13474);
    			add_location(hr2, file, 995, 1, 13519);
    			add_location(hr3, file, 997, 1, 13561);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr0, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(menu, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr1, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(optimize, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, hr2, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(gacha, target, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, hr3, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const menu_changes = {};
    			if (dirty & /*state*/ 1) menu_changes.state = /*state*/ ctx[0];
    			if (dirty & /*$menuFamiru*/ 16) menu_changes.menuList = /*$menuFamiru*/ ctx[4];
    			menu.$set(menu_changes);
    			const optimize_changes = {};
    			if (dirty & /*$menuFamiru*/ 16) optimize_changes.menuList = /*$menuFamiru*/ ctx[4];
    			optimize.$set(optimize_changes);
    			const gacha_changes = {};
    			if (dirty & /*$menuFamiru*/ 16) gacha_changes.menuList = /*$menuFamiru*/ ctx[4];
    			gacha.$set(gacha_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			transition_in(optimize.$$.fragment, local);
    			transition_in(gacha.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			transition_out(optimize.$$.fragment, local);
    			transition_out(gacha.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr0);
    			if (detaching) detach_dev(t0);
    			destroy_component(menu, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr1);
    			if (detaching) detach_dev(t2);
    			destroy_component(optimize, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(hr2);
    			if (detaching) detach_dev(t4);
    			destroy_component(gacha, detaching);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(hr3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(991:22) ",
    		ctx
    	});

    	return block;
    }

    // (983:0) {#if state === 0}
    function create_if_block(ctx) {
    	let hr0;
    	let t0;
    	let menu;
    	let t1;
    	let hr1;
    	let t2;
    	let optimize;
    	let t3;
    	let hr2;
    	let t4;
    	let gacha;
    	let t5;
    	let hr3;
    	let current;

    	menu = new Menu({
    			props: {
    				state: /*state*/ ctx[0],
    				menuList: /*$menuKanshita*/ ctx[1]
    			},
    			$$inline: true
    		});

    	optimize = new Optimize({
    			props: { menuList: /*$menuKanshita*/ ctx[1] },
    			$$inline: true
    		});

    	gacha = new Gacha({
    			props: { menuList: /*$menuKanshita*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			hr0 = element("hr");
    			t0 = space();
    			create_component(menu.$$.fragment);
    			t1 = space();
    			hr1 = element("hr");
    			t2 = space();
    			create_component(optimize.$$.fragment);
    			t3 = space();
    			hr2 = element("hr");
    			t4 = space();
    			create_component(gacha.$$.fragment);
    			t5 = space();
    			hr3 = element("hr");
    			add_location(hr0, file, 983, 1, 13252);
    			add_location(hr1, file, 985, 1, 13303);
    			add_location(hr2, file, 987, 1, 13350);
    			add_location(hr3, file, 989, 1, 13394);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr0, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(menu, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr1, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(optimize, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, hr2, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(gacha, target, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, hr3, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const menu_changes = {};
    			if (dirty & /*state*/ 1) menu_changes.state = /*state*/ ctx[0];
    			if (dirty & /*$menuKanshita*/ 2) menu_changes.menuList = /*$menuKanshita*/ ctx[1];
    			menu.$set(menu_changes);
    			const optimize_changes = {};
    			if (dirty & /*$menuKanshita*/ 2) optimize_changes.menuList = /*$menuKanshita*/ ctx[1];
    			optimize.$set(optimize_changes);
    			const gacha_changes = {};
    			if (dirty & /*$menuKanshita*/ 2) gacha_changes.menuList = /*$menuKanshita*/ ctx[1];
    			gacha.$set(gacha_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			transition_in(optimize.$$.fragment, local);
    			transition_in(gacha.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			transition_out(optimize.$$.fragment, local);
    			transition_out(gacha.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr0);
    			if (detaching) detach_dev(t0);
    			destroy_component(menu, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr1);
    			if (detaching) detach_dev(t2);
    			destroy_component(optimize, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(hr2);
    			if (detaching) detach_dev(t4);
    			destroy_component(gacha, detaching);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(hr3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(983:0) {#if state === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let h1;
    	let t1;
    	let h30;
    	let t3;
    	let h31;
    	let t4;
    	let a;
    	let t6;
    	let t7;
    	let button0;
    	let t9;
    	let button1;
    	let t11;
    	let button2;
    	let t13;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*state*/ ctx[0] === 0) return 0;
    		if (/*state*/ ctx[0] === 1) return 1;
    		if (/*state*/ ctx[0] === 2) return 2;
    		if (/*state*/ ctx[0] === 3) return 3;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "生協食堂シミュレータ(β)";
    			t1 = space();
    			h30 = element("h3");
    			h30.textContent = "最終更新 2023/01/20";
    			t3 = space();
    			h31 = element("h3");
    			t4 = text("このサイトは非公式です．最新のメニューは");
    			a = element("a");
    			a.textContent = "こちら";
    			t6 = text("を確認してください．");
    			t7 = space();
    			button0 = element("button");
    			button0.textContent = "館下食堂";
    			t9 = space();
    			button1 = element("button");
    			button1.textContent = "ファミール";
    			t11 = space();
    			button2 = element("button");
    			button2.textContent = "かさね";
    			t13 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h1, file, 969, 0, 12830);
    			add_location(h30, file, 970, 0, 12853);
    			attr_dev(a, "href", "https://west2-univ.jp/sp/osaka-univ.php");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noreferrer");
    			add_location(a, file, 972, 21, 12904);
    			add_location(h31, file, 971, 0, 12878);
    			add_location(button0, file, 978, 0, 13019);
    			add_location(button1, file, 979, 0, 13070);
    			add_location(button2, file, 980, 0, 13122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h31, anchor);
    			append_dev(h31, t4);
    			append_dev(h31, a);
    			append_dev(h31, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t13, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t13);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
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
    	let $sum;
    	let $menuKanshita;
    	let $menuRainbow;
    	let $menuKasane;
    	let $menuFamiru;
    	validate_store(sum, 'sum');
    	component_subscribe($$self, sum, $$value => $$invalidate(8, $sum = $$value));
    	validate_store(menuKanshita, 'menuKanshita');
    	component_subscribe($$self, menuKanshita, $$value => $$invalidate(1, $menuKanshita = $$value));
    	validate_store(menuRainbow, 'menuRainbow');
    	component_subscribe($$self, menuRainbow, $$value => $$invalidate(2, $menuRainbow = $$value));
    	validate_store(menuKasane, 'menuKasane');
    	component_subscribe($$self, menuKasane, $$value => $$invalidate(3, $menuKasane = $$value));
    	validate_store(menuFamiru, 'menuFamiru');
    	component_subscribe($$self, menuFamiru, $$value => $$invalidate(4, $menuFamiru = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	set_store_value(
    		menuKanshita,
    		$menuKanshita = [
    			{
    				selected: false,
    				id: 0,
    				name: "チキン甘辛ステーキ",
    				red: 3.1,
    				green: 0.1,
    				yellow: 2.4,
    				cost: 352
    			},
    			{
    				selected: false,
    				id: 1,
    				name: "ポークミンチカツ",
    				red: 1.5,
    				green: 0.2,
    				yellow: 3.1,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 2,
    				name: "ハンバーグペッパーソース",
    				red: 1.5,
    				green: 0.2,
    				yellow: 1.3,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 3,
    				name: "豚野菜柚子胡椒ポン酢炒め",
    				red: 1.4,
    				green: 0.7,
    				yellow: 1.3,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 4,
    				name: "チゲ豆腐",
    				red: 2.5,
    				green: 0.3,
    				yellow: 0.7,
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
    				name: "スパイスチキンサラダ",
    				red: 0.2,
    				green: 0.4,
    				yellow: 0.1,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 8,
    				name: "南瓜コロッケ",
    				red: 0.0,
    				green: 0.4,
    				yellow: 2.3,
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
    				name: "小松菜と揚げ生姜風味",
    				red: 0.2,
    				green: 0.1,
    				yellow: 0.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 12,
    				name: "ほうれん草ひじき和え",
    				red: 0.5,
    				green: 0.1,
    				yellow: 0.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 13,
    				name: "千切り煮",
    				red: 0.2,
    				green: 0.1,
    				yellow: 0.1,
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
    				name: "冷奴",
    				red: 0.6,
    				green: 0.0,
    				yellow: 0.0,
    				cost: 44
    			},
    			{
    				selected: false,
    				id: 16,
    				name: "千切り煮",
    				red: 0.2,
    				green: 0.1,
    				yellow: 0.1,
    				cost: 66
    			},
    			{
    				selected: false,
    				id: 17,
    				name: "納豆",
    				red: 0.7,
    				green: 0.0,
    				yellow: 0.1,
    				cost: 44
    			},
    			{
    				selected: false,
    				id: 18,
    				name: "じゃこ大根おろし",
    				red: 0.1,
    				green: 0.1,
    				yellow: 0.0,
    				cost: 66
    			},
    			{
    				selected: false,
    				id: 19,
    				name: "豚汁",
    				red: 0.6,
    				green: 0.4,
    				yellow: 0.4,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 20,
    				name: "味噌汁",
    				red: 0.4,
    				green: 0.0,
    				yellow: 0.3,
    				cost: 33
    			},
    			{
    				selected: false,
    				id: 21,
    				name: "温玉とペンネのサラダ",
    				red: 1.0,
    				green: 0.2,
    				yellow: 1.1,
    				cost: 176
    			},
    			{
    				selected: false,
    				id: 22,
    				name: "きつねうどん",
    				red: 0.9,
    				green: 0.0,
    				yellow: 4.6,
    				cost: 297
    			},
    			{
    				selected: false,
    				id: 23,
    				name: "きつねそば",
    				red: 0.9,
    				green: 0.0,
    				yellow: 4.2,
    				cost: 297
    			},
    			{
    				selected: false,
    				id: 24,
    				name: "かけうどん",
    				red: 0.0,
    				green: 0.0,
    				yellow: 4.2,
    				cost: 209
    			},
    			{
    				selected: false,
    				id: 25,
    				name: "かけそば",
    				red: 0.0,
    				green: 0.0,
    				yellow: 3.8,
    				cost: 209
    			},
    			{
    				selected: false,
    				id: 26,
    				name: "醤油ラーメン",
    				red: 0.6,
    				green: 0.1,
    				yellow: 5.4,
    				cost: 385
    			},
    			{
    				selected: false,
    				id: 27,
    				name: "ピリ辛サーモン丼",
    				red: 1.5,
    				green: 0.0,
    				yellow: 5.6,
    				cost: 462
    			},
    			{
    				selected: false,
    				id: 28,
    				name: "塩だれカツ丼",
    				red: 1.4,
    				green: 0.1,
    				yellow: 8.0,
    				cost: 407
    			},
    			{
    				selected: false,
    				id: 29,
    				name: "ロースカツカレー",
    				red: 1.6,
    				green: 0.3,
    				yellow: 9.1,
    				cost: 407
    			},
    			{
    				selected: false,
    				id: 30,
    				name: "カレーライス",
    				red: 0.2,
    				green: 0.3,
    				yellow: 7.0,
    				cost: 308
    			},
    			{
    				selected: false,
    				id: 31,
    				name: "ガトーショコラ",
    				red: 0.0,
    				green: 0.0,
    				yellow: 2.2,
    				cost: 220
    			},
    			{
    				selected: false,
    				id: 32,
    				name: "あまおう苺のモンブラン",
    				red: 0.0,
    				green: 0.0,
    				yellow: 2.6,
    				cost: 220
    			},
    			{
    				selected: false,
    				id: 33,
    				name: "ベルギーワッフル",
    				red: 0.0,
    				green: 0.0,
    				yellow: 3.5,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 34,
    				name: "大学芋",
    				red: 0.0,
    				green: 0.8,
    				yellow: 1.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 35,
    				name: "牛乳",
    				red: 1.7,
    				green: 0.0,
    				yellow: 0.0,
    				cost: 85
    			},
    			{
    				selected: false,
    				id: 36,
    				name: "大学生協コーヒー",
    				red: 1.2,
    				green: 0.0,
    				yellow: 0.6,
    				cost: 95
    			},
    			{
    				selected: false,
    				id: 37,
    				name: "焼きプリンタルト",
    				red: 0.0,
    				green: 0.0,
    				yellow: 1.5,
    				cost: 66
    			}
    		],
    		$menuKanshita
    	);

    	set_store_value(
    		menuFamiru,
    		$menuFamiru = [
    			{
    				selected: false,
    				id: 0,
    				name: "ホイコーロー",
    				red: 1.4,
    				green: 0.6,
    				yellow: 1.6,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 1,
    				name: "ハンバーグデミソース",
    				red: 1.5,
    				green: 0.2,
    				yellow: 1.3,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 2,
    				name: "ゆず塩ちゃんこ",
    				red: 1.0,
    				green: 0.7,
    				yellow: 1.3,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 3,
    				name: "ジューシー唐揚げ",
    				red: 2.7,
    				green: 0.0,
    				yellow: 2.2,
    				cost: 308
    			},
    			{
    				selected: false,
    				id: 4,
    				name: "かつおカツ青じそだれ",
    				red: 0.5,
    				green: 0.2,
    				yellow: 3.6,
    				cost: 220
    			},
    			{
    				selected: false,
    				id: 5,
    				name: "牛肉コロッケ",
    				red: 0.1,
    				green: 0.4,
    				yellow: 2.5,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 6,
    				name: "炭焼きチキン",
    				red: 1.1,
    				green: 0.0,
    				yellow: 0.5,
    				cost: 176
    			},
    			{
    				selected: false,
    				id: 7,
    				name: "鯖味噌煮",
    				red: 1.8,
    				green: 0.0,
    				yellow: 0.4,
    				cost: 176
    			},
    			{
    				selected: false,
    				id: 8,
    				name: "スパイスチキンサラダ",
    				red: 0.2,
    				green: 0.4,
    				yellow: 0.1,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 9,
    				name: "オクラ巣ごもり玉子",
    				red: 1.0,
    				green: 0.1,
    				yellow: 0.1,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 10,
    				name: "ほうれん草",
    				red: 0.0,
    				green: 0.2,
    				yellow: 0.0,
    				cost: 66
    			},
    			{
    				selected: false,
    				id: 11,
    				name: "小松菜と揚げ生姜風味",
    				red: 0.2,
    				green: 0.1,
    				yellow: 0.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 12,
    				name: "ひじきオクラ和え",
    				red: 0.2,
    				green: 0.2,
    				yellow: 0.3,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 13,
    				name: "ポテトサラダ",
    				red: 0.0,
    				green: 0.5,
    				yellow: 0.8,
    				cost: 66
    			},
    			{
    				selected: false,
    				id: 14,
    				name: "鶏きも煮",
    				red: 0.6,
    				green: 0.0,
    				yellow: 0.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 15,
    				name: "フルーツヨーグルト",
    				red: 0.5,
    				green: 0.0,
    				yellow: 0.5,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 16,
    				name: "大学芋",
    				red: 0.0,
    				green: 0.8,
    				yellow: 1.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 17,
    				name: "カレーあんかけうどん",
    				red: 1.0,
    				green: 0.0,
    				yellow: 4.9,
    				cost: 341
    			},
    			{
    				selected: false,
    				id: 18,
    				name: "カレーあんかけそば",
    				red: 1.0,
    				green: 0.0,
    				yellow: 4.5,
    				cost: 341
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
    				name: "担々麺",
    				red: 0.9,
    				green: 0.0,
    				yellow: 7.4,
    				cost: 429
    			},
    			{
    				selected: false,
    				id: 22,
    				name: "ピリ辛サーモン丼",
    				red: 1.5,
    				green: 0.0,
    				yellow: 5.6,
    				cost: 462
    			},
    			{
    				selected: false,
    				id: 23,
    				name: "トンカツ茶漬け丼",
    				red: 1.4,
    				green: 0.0,
    				yellow: 6.1,
    				cost: 407
    			},
    			{
    				selected: false,
    				id: 24,
    				name: "ロースカツカレー",
    				red: 1.6,
    				green: 0.3,
    				yellow: 9.1,
    				cost: 407
    			},
    			{
    				selected: false,
    				id: 25,
    				name: "カレーライス",
    				red: 0.2,
    				green: 0.3,
    				yellow: 7.0,
    				cost: 308
    			},
    			{
    				selected: false,
    				id: 26,
    				name: "ジューシー唐揚げ定食（小鉢1品付）月月曜日】【】＋＋＋",
    				red: 3.1,
    				green: 0.1,
    				yellow: 6.1,
    				cost: 500
    			},
    			{
    				selected: false,
    				id: 27,
    				name: "餃子野菜あんかけ定食（小鉢1品付）【火曜日】",
    				red: 0.6,
    				green: 0.4,
    				yellow: 7.8,
    				cost: 450
    			},
    			{
    				selected: false,
    				id: 28,
    				name: "チキンカツチリソース定食（小鉢1品付）【水曜日】【】",
    				red: 1.6,
    				green: 0.1,
    				yellow: 7.6,
    				cost: 450
    			},
    			{
    				selected: false,
    				id: 29,
    				name: "照りタルハンバーグ定食（小鉢1品付）【木曜日】",
    				red: 1.9,
    				green: 0.2,
    				yellow: 6.7,
    				cost: 450
    			},
    			{
    				selected: false,
    				id: 30,
    				name: "油淋鶏定食（小鉢1品付）【金曜日】",
    				red: 4.9,
    				green: 0.2,
    				yellow: 6.0,
    				cost: 500
    			}
    		],
    		$menuFamiru
    	);

    	set_store_value(
    		menuKasane,
    		$menuKasane = [
    			{
    				selected: false,
    				id: 0,
    				name: "タンドリーチキン",
    				red: 4.7,
    				green: 0.0,
    				yellow: 0.2,
    				cost: 308
    			},
    			{
    				selected: false,
    				id: 1,
    				name: "豚野菜柚子胡椒ポン酢炒め",
    				red: 1.4,
    				green: 0.7,
    				yellow: 1.3,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 2,
    				name: "ローストンカツおろしソース",
    				red: 1.8,
    				green: 0.0,
    				yellow: 3.3,
    				cost: 264
    			},
    			{
    				selected: false,
    				id: 3,
    				name: "ハンバーグチーズソース",
    				red: 2.1,
    				green: 0.1,
    				yellow: 0.9,
    				cost: 220
    			},
    			{
    				selected: false,
    				id: 4,
    				name: "鯖生姜煮",
    				red: 1.8,
    				green: 0.0,
    				yellow: 0.5,
    				cost: 176
    			},
    			{
    				selected: false,
    				id: 5,
    				name: "白身魚フライ",
    				red: 0.5,
    				green: 0.0,
    				yellow: 6.0,
    				cost: 220
    			},
    			{
    				selected: false,
    				id: 6,
    				name: "餃子野菜あんかけ",
    				red: 0.2,
    				green: 0.3,
    				yellow: 2.9,
    				cost: 176
    			},
    			{
    				selected: false,
    				id: 7,
    				name: "梅しそトンカツ",
    				red: 0.7,
    				green: 0.0,
    				yellow: 2.1,
    				cost: 176
    			},
    			{
    				selected: false,
    				id: 8,
    				name: "牛肉コロッケ",
    				red: 0.1,
    				green: 0.4,
    				yellow: 2.5,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 9,
    				name: "若布コーンサラダ",
    				red: 0.0,
    				green: 0.6,
    				yellow: 0.0,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 10,
    				name: "鶏きも煮",
    				red: 0.6,
    				green: 0.0,
    				yellow: 0.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 11,
    				name: "小松菜と揚げ生姜風味",
    				red: 0.2,
    				green: 0.1,
    				yellow: 0.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 12,
    				name: "さっぱり揚げ出し茄子",
    				red: 0.0,
    				green: 0.3,
    				yellow: 1.4,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 13,
    				name: "だし巻き",
    				red: 1.1,
    				green: 0.0,
    				yellow: 0.2,
    				cost: 66
    			},
    			{
    				selected: false,
    				id: 14,
    				name: "ほうれん草おひたし",
    				red: 0.0,
    				green: 0.2,
    				yellow: 0.0,
    				cost: 66
    			},
    			{
    				selected: false,
    				id: 15,
    				name: "温泉玉子",
    				red: 1.0,
    				green: 0.0,
    				yellow: 0.0,
    				cost: 44
    			},
    			{
    				selected: false,
    				id: 16,
    				name: "ミニサラダ",
    				red: 0.0,
    				green: 0.1,
    				yellow: 0.0,
    				cost: 44
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
    				name: "カレーあんかけうどん",
    				red: 1.0,
    				green: 0.0,
    				yellow: 4.9,
    				cost: 341
    			},
    			{
    				selected: false,
    				id: 20,
    				name: "カレーあんかけそば",
    				red: 1.0,
    				green: 0.0,
    				yellow: 4.5,
    				cost: 341
    			},
    			{
    				selected: false,
    				id: 21,
    				name: "きつねうどん",
    				red: 0.9,
    				green: 0.0,
    				yellow: 4.6,
    				cost: 297
    			},
    			{
    				selected: false,
    				id: 22,
    				name: "きつねそば",
    				red: 0.9,
    				green: 0.0,
    				yellow: 4.2,
    				cost: 297
    			},
    			{
    				selected: false,
    				id: 23,
    				name: "かけうどん",
    				red: 0.0,
    				green: 0.0,
    				yellow: 4.2,
    				cost: 209
    			},
    			{
    				selected: false,
    				id: 24,
    				name: "かけそば",
    				red: 0.0,
    				green: 0.0,
    				yellow: 3.8,
    				cost: 209
    			},
    			{
    				selected: false,
    				id: 25,
    				name: "欧風カレー",
    				red: 0.5,
    				green: 0.2,
    				yellow: 6.7,
    				cost: 407
    			},
    			{
    				selected: false,
    				id: 26,
    				name: "欧風カツカレー",
    				red: 1.9,
    				green: 0.2,
    				yellow: 8.9,
    				cost: 495
    			},
    			{
    				selected: false,
    				id: 27,
    				name: "豚カツ山賊タレ丼",
    				red: 2.4,
    				green: 0.1,
    				yellow: 7.6,
    				cost: 462
    			},
    			{
    				selected: false,
    				id: 28,
    				name: "ビビンバ丼",
    				red: 1.1,
    				green: 0.2,
    				yellow: 6.0,
    				cost: 407
    			},
    			{
    				selected: false,
    				id: 29,
    				name: "ライス",
    				red: 0.0,
    				green: 0.0,
    				yellow: 5.1,
    				cost: 115
    			},
    			{
    				selected: false,
    				id: 30,
    				name: "ちょこっとありがとうロール",
    				red: 0.0,
    				green: 0.0,
    				yellow: 1.6,
    				cost: 110
    			},
    			{
    				selected: false,
    				id: 31,
    				name: "焼きプリンタルト",
    				red: 0.0,
    				green: 0.0,
    				yellow: 1.5,
    				cost: 66
    			},
    			{
    				selected: false,
    				id: 32,
    				name: "大学芋",
    				red: 0.0,
    				green: 0.8,
    				yellow: 1.2,
    				cost: 88
    			},
    			{
    				selected: false,
    				id: 33,
    				name: "つけ麺鶏塩白湯）",
    				red: 1.7,
    				green: 0.1,
    				yellow: 8.3,
    				cost: 528
    			},
    			{
    				selected: false,
    				id: 34,
    				name: "つけ麺（魚介）",
    				red: 2.1,
    				green: 0.1,
    				yellow: 8.1,
    				cost: 528
    			},
    			{
    				selected: false,
    				id: 35,
    				name: "ケバブプレート",
    				red: 2.6,
    				green: 0.5,
    				yellow: 6.1,
    				cost: 594
    			}
    		],
    		$menuKasane
    	);

    	set_store_value(menuRainbow, $menuRainbow = [], $menuRainbow);
    	idIncrement.set($menuKanshita.length);

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

    	let state = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, state = 0);
    	const click_handler_1 = () => $$invalidate(0, state = 1);
    	const click_handler_2 = () => $$invalidate(0, state = 2);

    	$$self.$capture_state = () => ({
    		menuKanshita,
    		menuFamiru,
    		menuRainbow,
    		menuKasane,
    		idIncrement,
    		sum,
    		Optimize,
    		Menu,
    		Gacha,
    		state,
    		$sum,
    		$menuKanshita,
    		$menuRainbow,
    		$menuKasane,
    		$menuFamiru
    	});

    	$$self.$inject_state = $$props => {
    		if ('state' in $$props) $$invalidate(0, state = $$props.state);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		state,
    		$menuKanshita,
    		$menuRainbow,
    		$menuKasane,
    		$menuFamiru,
    		click_handler,
    		click_handler_1,
    		click_handler_2
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
