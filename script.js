const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 800, h: 800};
const svg = d3.select('svg');

size.w = document.querySelector('div#svg-container').clientWidth;
size.h = window.innerHeight * 0.8;

svg.attr('width', size.w)
    .attr('height', size.h)
    .attr('viewBox', [-size.w / 2, -size.h / 2, size.w, size.h]);

const containerG = svg.append('g').classed('container', true);
let data;
d3.json('data/flare-processed.json')
.then(function(d) {
    data = d;
    // console.log(data);
    draw();
});

function draw(data) {
    let hierarchy = d3.hierarchy(data);

    let bilinks = link2way(hierarchy);
    let layout = d3.cluster()
        .size([2*Math.PI, d3.min([size.w, size.h])/2 - 100])
        (bilinks);

    let node = svg.append('g')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 10)
        .selectAll('g')
        .data(layout.leaves())
        .join('g')
        .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
        .append('text')
        .attr('text-anchor', d => d.x < Math.PI ? 'start' : 'end')
        .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
        .text(d => d.data.name);

    let line = d3.lineRadial()
        .curve(d3.curveBundle.beta(0.85))
        .radius(d => d.y)
        .angle(d => d.x);

    let link = svg.append('g')
        .attr('stroke', '#aaa')
        .attr('fill', 'none')
        .selectAll('path')
        .data(layout.leaves().flatMap(leaf => leaf.outgoing))
        .join('path')
        .style('mix-blend-mode', 'multiply')
        .attr('d', (d) => {
            let node = d[0];
            let connectedNode = d[1];
            return line(node.path(connectedNode));
        });
}

function link2way(root) {
    let obj = {};
    root.leaves().forEach(d => {
        obj[id(d)] = d;
    });
    for (const d of root.leaves()) {
        d.incoming = [];
        d.outgoing = d.data.imports.map(e => [d, obj[e]]);
    }


    for (const d of root.leaves()) {
      for (const o of d.outgoing) {
        o[1].incoming.push(o);
      }
    }
    return root;
}

function id(node) {
    return `${node.parent ? id(node.parent) + '.' : ''}${node.data.name}`;
}