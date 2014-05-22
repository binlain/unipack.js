
(function(global){

    var _end = String.fromCharCode(127);
    var _minus = String.fromCharCode(126);
    var _dot = String.fromCharCode(125);
    var _e = String.fromCharCode(124);
    var _mapToEnd = new Array(58);
    var _mapSingle = new Array(58);
    var _mapDouble = new Array(58);

    var cur = 0;

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
            if(!c2){
                result += _end;
                break;
            }

            c1 = c2;
            c2 = string.charCodeAt(i+1);
            i++;

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
    
    function unpackNumber(string){
        var result = '';
        var length = string.length;

        while(cur < length){
            var c = string.charCodeAt(cur);
            cur++;
            
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

    var TYPE_SPECIAL = 0;
    var TYPE_UNUSED = 1;
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
            if(isNaN(object)){
                return packNumber(TYPE_SPECIAL + 24);
            }
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
                return packNumber(TYPE_SPECIAL + 8);
            }
            return packNumber(TYPE_SPECIAL + 16);
        }

        if(type === 'string'){
            return packNumber(TYPE_STRING + object.length * 8) + object;
        }

        if(type === 'object'){
            if(object instanceof Array){
                length = object.length;
                result = packNumber(TYPE_ARRAY + length * 8);
                for(var i=0; i<length; i++){
                    result += encode(object[i]);
                }
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

        return packNumber(TYPE_SPECIAL);

    }

    function decode(string){
        var _typeNum = unpackNumber(string);
        var typeNum = _typeNum % 8;
        
        if(typeNum === TYPE_SPECIAL){
            var type_num = (_typeNum - typeNum)/8;
            if(type_num === 1) return true;
            if(type_num === 2) return false;
            if(type_num === 3) return NaN;
            return; //type_num === 0
        }
        
        if(typeNum === TYPE_NUMBER_SHORT){
            return (_typeNum - typeNum)/8;
        }
        
        if(typeNum === TYPE_NUMBER_SHORT_NEG){
            return -(_typeNum - typeNum)/8;
        }
        
        if(typeNum === TYPE_NUMBER){
            return unpackNumber(string);
        }
        
        var length = (_typeNum - typeNum)/8;
        
        if(typeNum === TYPE_STRING){
            var old = cur;
            cur += length;
            return string.slice(old, cur);
        }

        var i;
        var object;
        
        if(typeNum === TYPE_ARRAY){
            length = (_typeNum - typeNum)/8;
            object = [];
            for(i=0; i<length; i++){
                object.push(decode(string));
            }
            return object;
        }
        
        if(typeNum === TYPE_OBJECT){
            length = (_typeNum - typeNum)/8;
            object = {};
            for(i=0; i<length; i++){
                object[decode(string)] = decode(string);
            }
            return object;
        }
    }

    global.unipackEncode = function(object){
        return encode(object);
    };
    global.unipackDecode = function(string){
        cur = 0;
        return decode(string);
    };


})(module ? module.exports : window);
