var unipack = require("./unipack.js");

function test(name, object){
    var result = unipack.unipackEncode(object);
    var jresult = JSON.stringify(object);

    var rlength = new Buffer(result).length;
    var rjlength = new Buffer(jresult).length;
    var saving = (100 - (rlength / rjlength * 100)).toFixed(2);

    console.log(name,"->",rjlength+" bytes","vs",rlength+" bytes","("+saving+"% saved)");

    var unpack = unipack.unipackDecode(result);
    
    if(jresult !== JSON.stringify(unpack)){
        throw "TEST "+name+" failed!";
    }
}

console.log("TESTING JSON vs UNIPACK");
console.log("");

var date = Date.now();

test("fraction", -234345234.23452345);
test("small fraction", 0.23452345);
test("small fraction2", 0.000000000000000000023452345);
test("big fraction1", 74089217340987234.000000000000000000023452345);
test("big fraction2", 7408921734098723474823.00000000000000000000432023452345);

test("small number1", 734);
test("small number2", 5629499131288);
test("small number3", -56294991288);

test("big number", 56294995342131288);
test("big number2", 562949953427438324131288);


test("big number", Math.pow(2, 70));

test("unix time", (new Date()).getTime());

test("random number1", Math.random());
test("random number2", Math.random());
test("random number3", Math.random());

test("true", true);

test("false", false);

test("short string", "test");

test("string", "This is a test");

test("long string1", 'And luis said: "Thou shall not pass", but JSON replied: "I will pass", and unipack said: "I will pass better"');
test("long string2", 'And luis said: Thou shall not pass, but JSON replied: I will pass, and unipack said: I will pass better');

test("array", ["string",238475834223,234895.23452345,true,false]);
test("array2", ["nig",238475834223,4234234,-33000]);

test("volafile", ["Yjn4PfUM5CdlA","6a0120a85dcdae970b017615e00eec970c-800wi.png","image",3892,1395870258866,["user:Lain"],["thumb"]]);

test("complex", {
    number : 2342344.1234123,
    string : "thisisatest",
    array : [324.1234, "test123", {th:34, bool:true, bool2:false, n:-123948.41234}],
});

console.log("All tests took", Date.now() - date);

console.log("Encoding benchmark");
console.log("500,000 random numbers in array");

var numbers = [];

for(var i=0; i<500000; i++){
    numbers.push(Math.random());
}

for(var i=0; i<10; i++){
    var start = Date.now();
    var result = unipack.unipackEncode(numbers);
    console.log("Unipack:", Date.now()-start);

    var start = Date.now();
    var result = JSON.stringify(numbers);
    console.log("JSON:", Date.now()-start);
}

console.log("2,000,000 random strings in array");
var crypt = require("crypto");

function randomString(){
    return crypt.pseudoRandomBytes(Math.floor(Math.random()*50)).toString("base64");
}

var strings = [];

for(var i=0; i<2000000; i++){
    strings.push(randomString);
}

for(var i=0; i<10; i++){
    var start = Date.now();
    var result = unipack.unipackEncode(strings);
    console.log("Unipack:", Date.now()-start);

    var start = Date.now();
    var result = JSON.stringify(strings);
    console.log("JSON:", Date.now()-start);
}

console.log("Random object (100,000 mutations)");

var object = {};
var node = object;

for(var i=0; i<100000; i++){
    if(Math.random()<0.1){
        node = object;
    }
    var key = randomString();
    if(Math.random()<0.6){
        node[key] = randomString();
    } else {
        var obj = {};
        node[key] = obj;
        node = obj;
    }
}

for(var i=0; i<10; i++){
    var start = Date.now();
    var result = unipack.unipackEncode(object);
    console.log("Unipack:", Date.now()-start);

    var start = Date.now();
    var result = JSON.stringify(object);
    console.log("JSON:", Date.now()-start);
}

console.log(object);
