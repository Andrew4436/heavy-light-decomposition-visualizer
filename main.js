const edge_input = document.getElementById("edge-input");
const start_button = document.getElementById("start-button");
const visualize_button = document.getElementById("visualize-button");
const query_button = document.getElementById("query-button");
const start_node_input = document.getElementById("from");
const end_node_input = document.getElementById("to");
const query_type = document.getElementById("query-type");
const result_inner_container = document.getElementById("result-inner-container");
let nodes = new Set()
// const tmp_edges = [[0,1],[0,2],[1,3],[1,4],[1,5],[2,6],[2,7],[3,8],[4,9],[4,10],[5,11],[7,12],[7,13],[8,14],[8,15],[8,16],[10,17],[11,18],[13,19],[13,20],[14,21],[16,22],[18,23],[19,24]]

let cy = null;
let edges;
let visualize_mode = 0; 

import { subtree_size, heavy_child, label, chain, lift, depth, set_up_HLD, HLD_query } from "./HeavyLightDecomposition.js";
function check_valid_edge(edges_str) {
    try {
        const edges = JSON.parse(edges_str); // parse input

        if (!Array.isArray(edges)) {
            console.log("Input is not an array.");
            return false;
        }
        // for each edge, make sure its valid
        for (let edge of edges) {
            if (
                !Array.isArray(edge) ||
                edge.length !== 2 ||
                typeof edge[0] !== "number" ||
                typeof edge[1] !== "number"
            ) {
                return false;
            }
        }

        return true;
    } catch (e) {
        return false;
    }
}

function start() {
    const edges_str = edge_input.value;
    if (check_valid_edge(edges_str)) {
        edges = JSON.parse(edges_str)
        drawGraph()
        set_up_HLD(edges.length + 1, edges)
    } else {
        alert("Invalid edges. Please enter a valid edges. (ex: [[1,2],[2,3]])");
    }
}

function drawGraph() {
    visualize_mode = 0;
    const elements = [];

    const nodeSet = new Set();
    for (const [u, v] of edges) {
        nodeSet.add(u);
        nodeSet.add(v);

        elements.push({
            data: { id: `${Math.min(u, v)}-${Math.max(u,v)}`, source: `${u}`, target: `${v}` }
        });
    }
    nodes = nodeSet
    for (const node of nodeSet) {
        elements.push({
            data: { id: `${node}` }
        });
    }
    // destroy previous tree (if there is any)
    if (cy) {
        reset();
        cy.destroy();
    }
    cy = cytoscape({
        container: document.getElementById('cy'),
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': 'darkgrey',
                    'label': 'data(id)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'border': '1px solid black',
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': 'gray',
                    'target-arrow-color': '#aaa',
                    'target-arrow-shape': 'triangle'
                }
            }
        ],
        layout: {
            name: 'breadthfirst',
            directed: true,
            padding: 10
        },
        userZoomingEnabled: false,
        userPanningEnabled: false
    });
    cy.on('tap', 'node', function(evt) {
        const node = evt.target;
        const id = node.id();
        const info = `
            Node ID: ${id}
            Node Label: ${label[id]}
            Chain Head: ${chain[id]}
            Depth: ${depth[id]}
            Heavy Child: ${heavy_child[id]}
            Subtree Size: ${subtree_size[id]}
        `;
        alert(info);
    });
    
}
// reset tree to default
function reset() {
    if (cy) {
        result_inner_container.innerText = "";
        visualize_mode = 0;
        for (let value of nodes) {
            let node = cy.getElementById(`${value}`);
            node.style('background-color', 'darkgrey');
        }
        for (let [u, v] of edges) {
            let edge = cy.getElementById(`${Math.min(u, v)}-${Math.max(u,v)}`);
            edge.style('line-color', 'grey');
        }
    }
}

function color_graph() {
    if (cy) {
        if (visualize_mode) {
            for (let value of nodes) {
                let node = cy.getElementById(`${value}`);
                // label each node light or heavy
                if (chain[value]!==value) {
                    node.style('background-color', 'red'); 
                } else {
                    node.style('background-color', 'blue');
                }
            }
            for (let [u, v] of edges) {
                let edge = cy.getElementById(`${Math.min(u, v)}-${Math.max(u,v)}`);
                // label each edge ligth or heavy
                if (heavy_child[u] == v || heavy_child[v] == u) {
                    edge.style('line-color', 'red');
                } else {
                    edge.style('line-color', 'blue');
                }
            }
        } else {
            reset();
        }
    }
}

function Query() {
    let u = parseInt(start_node_input.value)
    let v = parseInt(end_node_input.value)
    // make sure u and v is a valid node
    if (!nodes.has(u) || !nodes.has(v) || !cy) {
        alert("Please enter a valid node")
    } else {
        reset(); 
        let [ret, lca, time] = HLD_query(u, v, query_type.value);
        let node = cy.getElementById(`${lca}`);
        node.style("background-color", 'green');
        let tmpu = u, tmpv = v;
        // color every node and edges that is being processed
        while (tmpu != lca) {
            let node = cy.getElementById(`${tmpu}`);
            let edge = cy.getElementById(`${Math.min(tmpu, lift[0][tmpu])}-${Math.max(tmpu,lift[0][tmpu])}`);
            if (chain[tmpu]!==tmpu) {
                node.style('background-color', 'red');
                edge.style('line-color', 'red');
            } else {
                node.style('background-color', 'blue');
                edge.style('line-color', 'blue');
            }
            tmpu = lift[0][tmpu];
        }
        while (tmpv != lca) {
            let node = cy.getElementById(`${tmpv}`);
            let edge = cy.getElementById(`${Math.min(tmpv, lift[0][tmpv])}-${Math.max(tmpv,lift[0][tmpv])}`);
            if (chain[tmpv]!==tmpv) {
                node.style('background-color', 'red');
                edge.style('line-color', 'red');
            } else {
                node.style('background-color', 'blue');
                edge.style('line-color', 'blue');
            }
            tmpv = lift[0][tmpv];
        }
        // show result
        let result_div = document.createElement("div");
        result_div.innerText = `result of this query is ${ret}, and it took ${Math.ceil(time*1000)/1000}ms`;
        result_inner_container.appendChild(result_div);
    }
    console.log(start_node_input.value, end_node_input.value)
}
function change_mode() {
    if (cy) {
        visualize_mode = 1 - visualize_mode;
        color_graph();
    }
}

visualize_button.addEventListener("click", change_mode);
start_button.addEventListener("click", start);
query_button.addEventListener("click", Query)