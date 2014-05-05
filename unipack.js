
(function(global){

    var _end = String.fromCharCode(127);
    var _minus = String.fromCharCode(126);
    var _dot = String.fromCharCode(125);
    var _e = String.fromCharCode(124);
    var _mapToEnd = new Array(58);
    var _mapSingle = new Array(58);
    var _mapDouble = new Array(58);

    for(var i=0; i<10; i++){
        _mapToEnd[i+48] = String.fromCharCode(i+110);
    }
    
    for(i=0; i<10; i++){
        _mapSingle[i+48] = String.fromCharCode(i+100);
    }
    
    for(i=0; i<10; i++){
        var arr = new Array(58);
        _mapDouble[i+48] = arr;
        for(var i2=0; i2<10; i2++){
            arr[i2+48] = String.fromCharCode(i*10+i2);
        }
    }

    function packNumber(number){
        var string = number.toString();
        var result = '';

        var c1;
        var c2 = string.charCodeAt(0);

        var i = 0;
        while(true){
            c1 = c2;
            c2 = string.charCodeAt(i+1);
            i++;

            if(!c1){
                result += _end;
                break;
            }

            //plus sign, ignore
            if(c1 === 43) continue;

            //c1 is a number
            if(c1 >= 48 && c1 < 58){
                if(!c2){ //c2 is end
                    result += _mapToEnd[c1];
                    break;
                } else if(c2 >= 48 && c2 <=57){ //c2 is number
                    result+=_mapDouble[c1][c2];
                    c2 = string.charCodeAt(i+1);
                    i++;
                    continue;
                }
                result += _mapSingle[c1];
                continue;
            }

            if(c1 === 45){
                result += _minus;
                continue;
            }
            
            if(c1 === 46){
                result += _dot;
                continue;
            }

            //code 101
            result += _e;
        }
        
        return result;
    }
    
    function unpackNumber(string, iter){
        var result = '';
        var length = string.length;

        while(iter.cur < length){
            var c = string.charCodeAt(iter.cur);
            iter.cur++;
            
            if(c < 10){ //double number less than 10
                result += '0'+c;
                continue;
            }
            
            if(c < 100){ //double number
                result += c;
                continue;
            }
            
            if(c < 110){ //single number
                result += c - 100;
                continue;
            }
            
            if(c < 120){ //number + end
                result += c - 110;
                break;
            }

            if(c === 127){ //end
                break;
            }

            if(c === 126){ //minus
                result += '-';
                continue;
            }

            if(c === 125){ // dot
                result += '.';
                continue;
            }
            
            if(c === 124){ // e
                result += 'e';
            }
        }
        return parseFloat(result);
    }

    var TYPE_UNDEFINED = 0;
    var TYPE_BOOL = 1;
    var TYPE_NUMBER = 2;
    var TYPE_NUMBER_SHORT = 3; //Less than 562949953421312 (can safely be multiplied by 8) and not fraction
    var TYPE_NUMBER_SHORT_NEG = 4;
    var TYPE_STRING = 5;
    var TYPE_ARRAY = 6;
    var TYPE_OBJECT = 7;

    function encode(object){
        var type = typeof(object);
        var result, length, abs;

        if(type === 'number'){
            if(object % 1 === 0){
                abs = Math.abs(object);
                if(abs < 562949953421312){
                    return packNumber((object > 0 ? TYPE_NUMBER_SHORT : TYPE_NUMBER_SHORT_NEG) + abs * 8);
                }
            }
            return packNumber(TYPE_NUMBER) + packNumber(object);
        }
        
        if(type === 'boolean'){
            if(object){
                return packNumber(TYPE_BOOL + 8);
            }
            return packNumber(TYPE_BOOL);
        }

        if(type === 'string'){
            return packNumber(TYPE_STRING + object.length * 8) + object;
        }

        if(type === 'object'){
            if(object instanceof Array){
                length = object.length;
                result = object.reduce(encodeMapReduce, packNumber(TYPE_ARRAY + length * 8));
                return result;
            }

            result = '';
            length = 0;
            for(var a in object){
                if(object.hasOwnProperty(a)){
                    result += encode(a) + encode(object[a]);
                    length++;
                }
            }
            return packNumber(TYPE_OBJECT + length * 8) + result;
        }

        return packNumber(TYPE_UNDEFINED);

    }

    function encodeMapReduce(a, b){
        return a + encode(b);
    }

    function decode(string, iter){
        var _typeNum = unpackNumber(string, iter);
        var typeNum = _typeNum % 8;
        
        if(typeNum === TYPE_UNDEFINED){
            return;
        }
        
        if(typeNum === TYPE_NUMBER_SHORT){
            return (_typeNum - typeNum)/8;
        }
        
        if(typeNum === TYPE_NUMBER_SHORT_NEG){
            return -(_typeNum - typeNum)/8;
        }
        
        if(typeNum === TYPE_NUMBER){
            return unpackNumber(string, iter);
        }
        
        if(typeNum === TYPE_BOOL){
            return (_typeNum - typeNum) === 8;
        }

        var length = (_typeNum - typeNum)/8;
        
        if(typeNum === TYPE_STRING){
            var start = iter.cur;
            iter.cur += length;
            return string.slice(start, iter.cur);
        }

        var i;
        var object;
        
        if(typeNum === TYPE_ARRAY){
            length = (_typeNum - typeNum)/8;
            object = [];
            for(i=0; i<length; i++){
                object.push(decode(string, iter));
            }
            return object;
        }
        
        if(typeNum === TYPE_OBJECT){
            length = (_typeNum - typeNum)/8;
            object = {};
            for(i=0; i<length; i++){
                object[decode(string, iter)] = decode(string, iter);
            }
            return object;
        }
    }

    global.unipackEncode = encode;
    global.unipackDecode = function(string){
        return decode(string, {cur:0});
    };


})(module ? module.exports : window);
