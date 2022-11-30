// 処理中かどうか
var working = false;
// 8以上にすると計算量で死ぬと思う（何個までの点を配慮するか）
const maxTargetLength = 7;
// いくつまで違うやつがあっても許すか？ 0なら完全一致、1なら1つくらい抜けがあってもという感じ
const numAllowable = 1;
// これはAPIで処理するときはいらない
const numOfPenguinJSON = 12;

window.onload = function(){
    // 出力用のテーブルを用意する
    prepareResultsTable();

    // メインモジュール
    mainModule();
}

// メインモジュール
function mainModule(){
    let p1 = 1;
    let p2 = 2;

    setInterval(function(){
        // working == true のときは処理中なので無視する
        if( working == false ){
            if(p1 < numOfPenguinJSON){
                working = true;
                console.log("compare: " + p1 + ", " + p2);
                let penguin1_json_url = "json/pen"+p1+".json";
                let penguin2_json_url = "json/pen"+p2+".json";
                compareTwoPenguins(penguin1_json_url, penguin2_json_url,
                    document.querySelector("#score" + p1 + "_" + p2),
                    document.querySelector("#score" + p2 + "_" + p1)
                );
            } else {
                clearInterval(this);
            }
            if(p2 < numOfPenguinJSON) { p2++; }
            else { p1++; p2=p1+1; }
        }
    }, 100);
}

function calcSimilarityEucrid(_penguin1json, _order1, _penguin2json, _order2, _minStroke){
    let distance = 0;
    for(let k=0; k<_minStroke-numAllowable; k++){
        distance += calcDistanceFromPt(_penguin1json[_order1[k]].pos[0], _penguin2json[_order2[k]].pos[0]);
    }
    return distance;
}

function calcCosineSimilarity(_penguin1json, _order1, _penguin2json, _order2, _minStroke){
    let cog = {x: 0, y: 0};
    for(let k=0; k<_minStroke-numAllowable; k++){
        cog.x += _penguin1json[_order1[k]].pos[0].x + _penguin2json[_order2[k]].pos[0].x;
        cog.y += _penguin1json[_order1[k]].pos[0].y + _penguin2json[_order2[k]].pos[0].y;
    }
    cog.x /= (_minStroke * 2);
    cog.y /= (_minStroke * 2);

    let similarity = 0;
    for(let k=0; k<_minStroke-numAllowable; k++){
        similarity += 
            ( (_penguin1json[_order1[k]].pos[0].x-cog.x) * (_penguin2json[_order2[k]].pos[0].x-cog.x)
            + (_penguin1json[_order1[k]].pos[0].y-cog.y) * (_penguin2json[_order2[k]].pos[0].y-cog.y))
            / (calcDistanceFromPt(_penguin1json[_order1[k]].pos[0], cog) * calcDistanceFromPt(_penguin2json[_order2[k]].pos[0], cog));
    }
    //console.log(similarity);
    return similarity / (_minStroke-numAllowable);
}

// JSONを利用して比較するよ
function compareTwoPenguinsWithJSON(_penguin1json, _penguin2json){
    var results = {};

    // ストローク数の大小と、その比をとっておく
    let minStroke = Math.min(Math.min(_penguin1json.length, _penguin2json.length), maxTargetLength);
    let maxStroke = Math.max(_penguin1json.length, _penguin2json.length);
    let ratioMinMax = maxStroke / minStroke;

    // 点列の全てのペアを作って網羅するため、まずは 0～点の数-1 の配列を作る
    // ただ、8以上になると処理が重くなるので、maxTargetLengthで上限を設定している
    penguin1 = [...Array(Math.min(_penguin1json.length, maxTargetLength))].map((_, i) => i);
    penguin2 = [...Array(Math.min(_penguin2json.length, maxTargetLength))].map((_, i) => i);

    // 点列の並び替えをすべてやる
    penguin1order = permute( penguin1 );
    penguin2order = permute( penguin2 );

    // ここから計算
    results.minDistance = 9999;    
    results.maxSimilarity = -10;
    for(let i=0; i<penguin1order.length; i++){
        for(let j=0; j<penguin2order.length; j++){
            let similarity = calcCosineSimilarity(_penguin1json, penguin1order[i], _penguin2json, penguin2order[j], minStroke);
            let distance = calcSimilarityEucrid(_penguin1json, penguin1order[i], _penguin2json, penguin2order[j], minStroke);
            if(distance < results.minDistance){
                results.minDistance = distance;
            }
            if(similarity > results.maxSimilarity){
                results.maxSimilarity = similarity;
            }
        }
    }
    results.minScore = results.minDistance * (maxStroke / minStroke);
    return results;
}

async function compareTwoPenguins(_url1, _url2, _dom1, _dom2){
    const urls = [_url1, _url2];
    await Promise.all(urls.map(get))
    .then(values => {        
        let results = compareTwoPenguinsWithJSON(values[0], values[1]);
        console.log(_url1 + ", " + _url2 + " : distance = " + Math.floor(results.minDistance) + " (" + Math.floor(results.minScore) + ")" );

        // スコアの計算結果をDOMに設定する（dom1とdom2は対角の関係）
        //setResultOnTable1(results.maxSimilarity, _dom1);
        //setResultOnTable1(results.maxSimilarity, _dom2);
        // setResultOnTable2(results.minDistance, _dom1);
        // setResultOnTable2(results.minDistance, _dom2);
        setResultOnTable2(results.minScore, _dom1);
        setResultOnTable2(results.minScore, _dom2);
        working = false;
    });
}

// tableを準備して表示
function prepareResultsTable(){
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
}

function setResultOnTable1(_score, _dom){
    _score *= 100;
    _dom.innerHTML = Math.floor(_score);
    if(_score > 95){
        _dom.style.backgroundColor = "#ff5555";
    } else if(_score > 90){
        _dom.style.backgroundColor = "#ffbbbb";
    }
}

function setResultOnTable2(_score, _dom){
    _dom.innerHTML = Math.floor(_score);
    if(_score < 100){
        _dom.style.backgroundColor = "#ff5555";
    }
    else if(_score < 200){
        _dom.style.backgroundColor = "#ffbbbb";
    }
}

// 全パターンを網羅するだけの関数
var permute = function(_nums) {
    var results = [];

    var recursive = (result) => {
        if (result.length === _nums.length) {
            results.push(result.slice());
            return;
        }

        for (var i = 0; i < _nums.length; i++) {
            if (!result.includes(_nums[i])) {
                result.push(_nums[i]);
                recursive(result);
                result.pop();
            }
        }    
    }

    recursive([]);
    return results;
};

function get(_url) {
    return fetch(_url)
    .then( function( _response ){
        return _response.json();
    });
}

// ユークリッド距離の計算
var calcDistanceFromPt = function(_pt1, _pt2){
    return calcDistance(_pt1.x, _pt1.y, _pt2.x, _pt2.y);
}

var calcDistance = function(_x1, _y1, _x2, _y2){
    return Math.sqrt((_x1-_x2)*(_x1-_x2) + (_y1-_y2)*(_y1-_y2));
}