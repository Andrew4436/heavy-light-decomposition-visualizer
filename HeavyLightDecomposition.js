let n;
let m;
let adj;
let max_segtree, min_segtree, xor_segtree, sum_segtree;
let subtree_size; // subtree size of every node
let heavy_child; // heavy child of every node
let label; // id of every node from 0 to n-1
let chain; // parent of every node in each heavy path. if node is not part of heavy path, chain[node] = node
let lift; // lift[i][node] = ancestor of node if we go up 2^i times
let depth; // depth[node] = depth of node
let inf = 10000000;

// segment tree _______________________________________________________________________________________________________________________________________
function fmax(a, b) {
    return Math.max(a, b);
}

function fmin(a, b) {
    return Math.min(a, b);    
}

function fxor(a, b) {
    return a ^ b;
}

function fsum(a, b) {
    return a + b;
}

function segtree_update(segtree, node, l, r, idx, val, f) {
    if (l === r) {
        segtree[node] = val;
    } else {
        let mid = Math.floor((l + r) / 2);
        if (mid >= idx) segtree_update(segtree, 2 * node + 1, l, mid, idx, val, f);
        else segtree_update(segtree, 2 * node + 2, mid + 1, r, idx, val, f);
        segtree[node] = f(segtree[2 * node + 1], segtree[2 * node + 2]);
    }
}

function segtree_query(segtree, node, lb, rb, l, r, f, query_type) {
    if (l > rb || r < lb) {
        if (query_type=="max query") return -inf;
        if (query_type=="min query") return inf;
        return 0;
    };
    if (l >= lb && r <= rb) return segtree[node];
    let mid = Math.floor((l + r) / 2);
    return f(segtree_query(segtree, 2 * node + 1, lb, rb, l, mid, f, query_type), segtree_query(segtree, 2 * node + 2, lb, rb, mid + 1, r, f, query_type));
}


// find subtree size, depth, and heavy child of each node
function find_subtree_size(node, par, x) {
    depth[node] = x;
    lift[0][node] = par;
    subtree_size[node] = 1;
    let heavy = -1, size = 0;
    for (let nei of adj[node]) {
        if (nei !== par) {
            find_subtree_size(nei, node, x + 1);
            subtree_size[node] += subtree_size[nei];
            if (subtree_size[nei] > size) {
                heavy = nei;
                size = subtree_size[nei];
            }
        }
    }
    heavy_child[node] = heavy;
}

let id = 0;
// label each node with a number from 0 to n-1 to use for segment tree
function dfs_label(node, par) {
    label[node] = id; // label each node with unique id from 0 to n-1
    segtree_update(max_segtree, 0, 0, n-1, label[node], node, fmax)
    segtree_update(min_segtree, 0, 0, n-1, label[node], node, fmin)
    segtree_update(xor_segtree, 0, 0, n-1, label[node], node, fxor)
    segtree_update(sum_segtree, 0, 0, n-1, label[node], node, fsum)
    id++;
    // explore the heavy child first so each node in heavy chains have consecutive id
    if (heavy_child[node] !== -1) {
        dfs_label(heavy_child[node], node);
    }
    for (let nei of adj[node]) {
        if (nei !== par && nei !== heavy_child[node]) {
            dfs_label(nei, node);
        }
    }
}

// find every heavy chains
function find_heavy_chain(node, par) {
    if (heavy_child[node] !== -1) {
        chain[heavy_child[node]] = chain[node];
    }
    for (let nei of adj[node]) {
        if (nei !== par) {
            find_heavy_chain(nei, node);
        }
    }
}

// find LCA of u and v
function LCA(u, v) {
    // make sure depth of u is always greater then depth of v
    if (depth[u] < depth[v]) [u, v] = [v, u];
    let diff = depth[u] - depth[v];
    // make them same depth
    for (let i = 0; i < m; i++) {
        if (diff & (1 << i)) u = lift[i][u];
    }
    if (u==v) return u;
    for (let i = m - 1; i >= 0; i--) {
        if (lift[i][u] !== lift[i][v]) {
            u = lift[i][u];
            v = lift[i][v];
        }
    }
    return lift[0][u];
}

// heavy light decomposition ___________________________________________________________________________________________________________________________
function set_up_HLD(number_of_nodes, edges) {
    n = number_of_nodes
    adj = Array.from({ length: n }, () => []);
    for (let i = 0; i < 100000; i++) {
        if ((1<<i) > n) break;
        m = i;
    }
    for (let [u, v] of edges) {
        adj[u].push(v);
        adj[v].push(u);
    }
    max_segtree = Array(4 * n).fill(-inf);
    min_segtree = Array(4 * n).fill(inf);
    xor_segtree = Array(4 * n).fill(0);
    sum_segtree = Array(4 * n).fill(0);
    subtree_size = Array(n).fill(0); // subtree size of every node
    heavy_child = Array(n).fill(-1); // heavy child of every node
    label = Array(n).fill(-1); // id of every node from 0 to n-1
    chain = Array.from({ length: n }, (_, i) => i); // parent of every node in each heavy path. if node is not part of heavy path, chain[node] = node
    lift = Array.from({ length: m }, () => Array(n).fill(-1)); // lift[i][node] = ancestor of node if we go up 2^i times
    depth = Array(n).fill(0); // depth[node] = depth of node

    find_subtree_size(0, -1, 0);
    dfs_label(0, -1);
    find_heavy_chain(0, -1);
    
    for (let i = 1; i < m; i++) {
        for (let node = 0; node < n; node++) {
            if (lift[i - 1][node] === -1) continue;
            lift[i][node] = lift[i - 1][lift[i - 1][node]];
        }
    }
}

// answer for path u to a (a is an ancestor of u)
function helper(lca, u, a, segtree, f, query_type) {
    let cur = u
    let res = 0
    if (query_type=="max query") res = -inf;
    if (query_type=="min query") res = inf;
    console.log(res)
    while (depth[cur] >= depth[a] && cur != -1) {
        // not part of any heavy chains
        console.log(cur, res, f(cur, res));
        if (chain[cur] === cur) {
            res = f(res, cur)
        } else {
            // make sure that the top most node in heavy chain does not go above the ancestor
            if (depth[chain[cur]] < depth[a]) {
                res = f(res, segtree_query(segtree, 0, label[lca], label[cur], 0, n-1, f, query_type))
            } else {
                res = f(res, segtree_query(segtree, 0, label[chain[cur]], label[cur], 0, n-1, f, query_type))
            }
        }
        cur = lift[0][chain[cur]]
    }
    return res
}

function HLD_query(u, v, query_type) {
    let lca = LCA(u, v);
    let f;
    let segtree;
    let HLD_t0 = performance.now()
    // set f and HLD based on query type
    if (query_type==="max query") {
        segtree = max_segtree;
        f = fmax;
    } else if (query_type=="min query") {
        segtree = min_segtree;
        f = fmin;
    } else if (query_type=="xor query") {
        segtree = xor_segtree;
        f = fxor;
    } else {
        segtree = sum_segtree;
        f = fsum;
    }
    let ret1 = helper(lca, u, lca, segtree, f, query_type);
    let ret2 = helper(lca, v, lca, segtree, f, query_type);
    let ret = f(ret1, ret2);
    if (query_type==="sum query") ret-=lca;
    if (query_type==="xor query") ret^=lca;
    let HLD_t1 = performance.now()
    return [ret, lca, HLD_t1-HLD_t0]
}

export { subtree_size, heavy_child, label, chain, lift, depth, set_up_HLD, HLD_query };
















