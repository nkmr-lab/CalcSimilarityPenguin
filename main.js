var working = false;
const maxTargetLength = 7;
const numAllowable = 1;
const numOfPenguinJSON = 8;

window.onload = function(){
    let tableContent = "";
    tableContent += "<tr><td></td>";
    for(let j=1; j<=numOfPenguinJSON; j++){
        tableContent += "<td>" + "p" + j + "</td>";
    }
    tableContent += "</tr>";
    for(let i=1; i<=numOfPenguinJSON; i++){
        tableContent += "<tr>";
        tableContent += "<td>" + "p" + i + "</td>";
        for(let j=1; j<=numOfPenguinJSON; j++){
            tableContent += "<td id=score" + i + "_" + j + ">---</td>";
        }
        tableContent += "</tr>";
    }
    document.querySelector("#results").innerHTML = tableContent;

    let p1 = 1;
    let p2 = 0;
    setInterval(function(){
        if( working == true ){
            // ignore
        } else {
            if(p2 < numOfPenguinJSON) { p2 ++; }
            else {
                p2 = 1; p1++;
            }
            if(p1 > numOfPenguinJSON){
                clearInterval(this);
            }
            if(p1 != p2 && p1 <= numOfPenguinJSON){
                working = true;
                console.log("compare: " + p1 + ", " + p2);
                compareTwoPenguins("pen"+p1+".json", "pen"+p2+".json", document.querySelector("#score" + p1 + "_" + p2));
            }
        }
    }, 100);
    // for(let i=1; i<=numOfPenguinJSON; i++){
    //     for(let j=1; j<=numOfPenguinJSON; j++){
    //         if(i!=j){
    //             console.log("compare: " + i + ", " + j);
    //             compareTwoPenguins("pen"+i+".json", "pen"+j+".json", document.querySelector("#score" + i + "_" + j));
    //         }
    //     }
    // }
}

function get(url) {
    return fetch(url)
    .then( function( response ){
        return response.json();
    });
}

var calcDistanceFromPt = function(pt1, pt2){
    return calcDistance(pt1.x, pt1.y, pt2.x, pt2.y);
}

var calcDistance = function(x1, y1, x2, y2){
    return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
}

async function compareTwoPenguins(url1, url2, dom){
    const urls = [url1, url2];
    await Promise.all(urls.map(get))
    .then(values => {
        penguin1json = values[0];
        penguin2json = values[1];

        let minStroke = Math.min(Math.min(penguin1json.length, penguin2json.length), maxTargetLength);
        let maxStroke = Math.max(penguin1json.length, penguin2json.length);
        let ratioMinMax = maxStroke / minStroke;
        penguin1 = [...Array(Math.min(penguin1json.length, maxTargetLength))].map((_, i) => i);
        penguin2 = [...Array(Math.min(penguin2json.length, maxTargetLength))].map((_, i) => i);

        penguin1 = permute( penguin1 );
        penguin2 = permute( penguin2 );

        let minDistance = 0;
        let min_i = 0;
        let min_j = 0;
        for(let k=0; k<minStroke-numAllowable; k++){
            minDistance += calcDistanceFromPt(penguin1json[penguin1[0][k]].pos[0], penguin2json[penguin2[0][k]].pos[0]);
        }

        for(let i=0; i<penguin1.length; i++){
            //console.log("penguin1: " + i);
            for(let j=0; j<penguin2.length; j++){
                let distance = 0;
                for(let k=0; k<minStroke-numAllowable && distance < minDistance; k++){
                    distance += calcDistanceFromPt(penguin1json[penguin1[i][k]].pos[0], penguin2json[penguin2[j][k]].pos[0]);
                }
                if(distance < minDistance){
                    minDistance = distance;
                    min_i = i;
                    min_j = j;
                }
            }
        }
        console.log(url1 + ", " + url2 + " : distance = " + Math.floor(minDistance) + " (" + Math.floor(minDistance * (maxStroke / minStroke)) + ")" );
        let score = minDistance * ratioMinMax;
        //let score = minDistance;
        dom.innerHTML = Math.floor(score);

        if(score < 100) dom.style.backgroundColor = "#ff5555";
        else if(score < 200) dom.style.backgroundColor = "#ffbbbb";
        working = false;
    });
}

var permute = function(nums) {
    var results = [];

    var recursive = (result) => {
        if (result.length === nums.length) {
            results.push(result.slice());
            return;
        }

        for (var i = 0; i < nums.length; i++) {
            if (!result.includes(nums[i])) {
                result.push(nums[i]);
                recursive(result);
                result.pop();
            }
        }    
    }

    recursive([]);
    return results;
};