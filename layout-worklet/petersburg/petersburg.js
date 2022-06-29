// seeded random number generator for Javascript
// https://github.com/davidbau/seedrandom
!function(a,b){function c(c,j,k){var n=[];j=1==j?{entropy:!0}:j||{};var s=g(f(j.entropy?[c,i(a)]:null==c?h():c,3),n),t=new d(n),u=function(){for(var a=t.g(m),b=p,c=0;a<q;)a=(a+c)*l,b*=l,c=t.g(1);for(;a>=r;)a/=2,b/=2,c>>>=1;return(a+c)/b};return u.int32=function(){return 0|t.g(4)},u.quick=function(){return t.g(4)/4294967296},u.double=u,g(i(t.S),a),(j.pass||k||function(a,c,d,f){return f&&(f.S&&e(f,t),a.state=function(){return e(t,{})}),d?(b[o]=a,c):a})(u,s,"global"in j?j.global:this==b,j.state)}function d(a){var b,c=a.length,d=this,e=0,f=d.i=d.j=0,g=d.S=[];for(c||(a=[c++]);e<l;)g[e]=e++;for(e=0;e<l;e++)g[e]=g[f=s&f+a[e%c]+(b=g[e])],g[f]=b;(d.g=function(a){for(var b,c=0,e=d.i,f=d.j,g=d.S;a--;)b=g[e=s&e+1],c=c*l+g[s&(g[e]=g[f=s&f+b])+(g[f]=b)];return d.i=e,d.j=f,c})(l)}function e(a,b){return b.i=a.i,b.j=a.j,b.S=a.S.slice(),b}function f(a,b){var c,d=[],e=typeof a;if(b&&"object"==e)for(c in a)try{d.push(f(a[c],b-1))}catch(a){}return d.length?d:"string"==e?a:a+"\0"}function g(a,b){for(var c,d=a+"",e=0;e<d.length;)b[s&e]=s&(c^=19*b[s&e])+d.charCodeAt(e++);return i(b)}function h(){try{var b;return j&&(b=j.randomBytes)?b=b(l):(b=new Uint8Array(l),(k.crypto||k.msCrypto).getRandomValues(b)),i(b)}catch(b){var c=k.navigator,d=c&&c.plugins;return[+new Date,k,d,k.screen,i(a)]}}function i(a){return String.fromCharCode.apply(0,a)}var j,k=this,l=256,m=6,n=52,o="random",p=b.pow(l,m),q=b.pow(2,n),r=2*q,s=l-1;if(b["seed"+o]=c,g(b.random(),a),"object"==typeof module&&module.exports){module.exports=c;try{j=require("crypto")}catch(a){}}else"function"==typeof define&&define.amd&&define(function(){return c})}([],Math);

if (typeof registerLayout !== undefined) {
    registerLayout('petersburg', class {

        static get inputProperties() {
            return [ '--padding', '--seed', '--variance' ];
        }

        async intrinsicSizes() { /* TODO implement :) */ }

        getFreeRow(imageWidthPercentage, grid) {
            for (let i = 0; i < grid.length; i++) {
                for (let j = 0; j < grid[i].length; j++) {
                    // check if row is free:
                    if (!(grid[i].slice(j, j + imageWidthPercentage).includes(1))) {
                        return {row: i, column: j};
                    }
                }
            }
        }

        async layout(children, edges, constraints, styleMap) {

            const columns = 2;

            // How much can the images change their width
            const variance = styleMap.get('--variance').toString() * 0.01;

            // Seed
            const seed = styleMap.get('--seed').toString();
            if (seed !== "rng")
                Math.seedrandom(seed);

            // size of the container
            const inlineSize = constraints.fixedInlineSize;
            const middle = inlineSize / 2;
            console.log("inlineSize: "  + inlineSize);

            // get custom properties from element
            const padding = parseInt(styleMap.get('--padding').toString());
            const halfpadding = padding / 2;

            // Layout all children with simply their column size.
            const childInlineSize = (inlineSize - ((columns + 1) * padding)) / columns;
            console.log("childInlineSize: "  + childInlineSize);
            const childFragments = await Promise.all(children.map((child) => {
                // Add some rng to the image width
                let rng = parseInt(Math.random() * variance * childInlineSize / -2); // negative because we only make it smaller
                return child.layoutNextFragment({fixedInlineSize: childInlineSize + rng});
            }));

            let autoBlockSize = 0;

            const columnOffsets = Array(columns).fill(0);

            childFragments.forEach((childFragment, index) => {
                let isEven = index % 2 === 0;

                //childFragment.inlineOffset = padding + (childInlineSize + padding) * min.idx; // horizontal
                childFragment.inlineOffset = isEven ? (middle - childFragment.inlineSize - halfpadding) : middle + halfpadding;  // x achse
                childFragment.blockOffset = padding + columnOffsets[isEven ? 0 : 1];                 // y achse

                //console.log(index + " _ " + childFragment.blockOffset + " : " + childFragment.blockSize);
                columnOffsets[isEven ? 0 : 1] = childFragment.blockOffset + childFragment.blockSize;
                autoBlockSize = Math.max(autoBlockSize, columnOffsets[isEven ? 0 : 1] + padding);
            });

            // Petersburg
            const matrixSize = 10;
            const grid = Array(matrixSize).fill(Array(matrixSize).fill(0));

            for (const childFragment of childFragments) {
                let imageWidthPercentage = parseInt(matrixSize * childFragment.inlineSize / inlineSize);
                let freeRow = this.getFreeRow(imageWidthPercentage, grid);
                console.log("freeRow: " + freeRow.row + ":" + freeRow.column);

                // console.log(imageWidthPercentage); // how much percentage does the image need?
                if (freeRow) {
                    for (let i = 0; i < imageWidthPercentage; i++) {
                        grid[freeRow.row][freeRow.column + i] = 1;
                    }
                } else {
                    console.error("no more space!");
                }
                console.table(grid);
            }

            return {autoBlockSize, childFragments};
        }
    });
}