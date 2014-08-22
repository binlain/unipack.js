unipack.js
==========

JavaScript alternative to msgpack that is unicode compatible, ~30% smaller than JSON, but about 2x slower

I have never used this in anything but NodeJS, but it doesn't use any overly exotic JavaScript.

It compresses numbers about 35% better than JSON, strings 1% and everything
else by almost 100% (undefined, true, false, objects, arrays).

It runs about 2x - 1.5x slower than native JSON (on nodejs).

####Why does it compress the string representation of the number instead of the number itself?

Due to the way JavaScript handles numbers I found this to be the best compromise between speed and minification.

####Should I use this in production
No, you shouldn't
